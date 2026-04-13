"""Resume parse + embed Celery tasks."""
import asyncio
import os
import uuid
import httpx
import fitz  # PyMuPDF
import openai
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from src.workers.celery_app import celery_app
from src.models.resume import Resume
from src.models.embeddings import DocumentEmbedding

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg_async://postgres:postgres@localhost:5432/talentiq",
)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
openai.api_key = OPENAI_API_KEY

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    texts = []
    for page in doc:
        texts.append(page.get_text())
    doc.close()
    return "\n".join(texts)


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 64) -> list[str]:
    """Sliding window chunker over word tokens."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks


async def get_embeddings(texts: list[str]) -> list[list[float]]:
    client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY, base_url="https://api.ai.cc/v1")
    response = await client.embeddings.create(model="text-embedding-ada-002", input=texts)
    return [d.embedding for d in response.data]


async def _parse_resume_async(resume_id: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Resume).where(Resume.id == resume_id))
        resume = result.scalar_one_or_none()
        if not resume:
            return

        # Fetch PDF from S3/Cloudinary URL, or decode dev data: URL.
        file_url = resume.file_url or ""
        if file_url.startswith("data:application/pdf;base64,"):
            import base64

            b64 = file_url.split(",", 1)[1]
            file_bytes = base64.b64decode(b64)
        else:
            async with httpx.AsyncClient() as client:
                resp = await client.get(file_url)
                file_bytes = resp.content

        # Extract text
        raw_text = extract_text_from_pdf(file_bytes)
        resume.raw_text = raw_text

        # LLM parse sections via OpenAI
        oai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY, base_url="https://api.ai.cc/v1")
        parse_prompt = f"""
Parse this resume and return a JSON with keys:
skills (list of strings), experience (list of dicts with company/role/duration/bullets),
education (list of dicts with school/degree/year), projects (list of dicts with name/tech/description).
Resume text:
{raw_text[:8000]}
"""
        chat_resp = await oai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a resume parsing expert. Return only valid JSON."},
                {"role": "user", "content": parse_prompt},
            ],
            response_format={"type": "json_object"},
        )
        import json
        import re
        content = chat_resp.choices[0].message.content
        # Robustly extract JSON if LLM wraps it in markdown backticks
        match = re.search(r"```(?:json)?(.*?)```", content, re.DOTALL)
        if match:
            content = match.group(1).strip()
        
        parsed = json.loads(content)
        resume.parsed_json = parsed

        # ATS score: keyword overlap with tech vocabulary
        tech_vocab = {"python", "javascript", "typescript", "react", "fastapi", "docker", "kubernetes",
                      "aws", "gcp", "azure", "postgresql", "redis", "mongodb", "node", "java",
                      "machine learning", "deep learning", "sql", "git", "ci/cd", "rest api",
                      "microservices", "graphql", "tensorflow", "pytorch"}
        
        # Check if keyword substring exists in text (allows matching multi-word phrases)
        raw_lower = raw_text.lower()
        hits = sum(1 for keyword in tech_vocab if keyword in raw_lower)
        
        resume.ats_score = min(100, int((hits / len(tech_vocab)) * 100 * 2))
        resume.quality_score = min(100, resume.ats_score + 10)

        # Embeddings
        chunks = chunk_text(raw_text)
        if chunks:
            embeddings = await get_embeddings(chunks[:20])  # cap at 20 chunks for cost
            for idx, (chunk, emb) in enumerate(zip(chunks[:20], embeddings)):
                doc_emb = DocumentEmbedding(
                    id=str(uuid.uuid4()),
                    user_id=resume.user_id,
                    doc_type="resume",
                    doc_id=resume_id,
                    chunk_index=idx,
                    content=chunk,
                    embedding=emb,
                    metadata_json={"section": "full", "source": "resume"},
                )
                db.add(doc_emb)

        resume.parse_status = "done"
        await db.commit()


@celery_app.task(name="src.workers.resume_tasks.parse_resume", queue="high", bind=True, max_retries=3)
def parse_resume(self, resume_id: str):
    """Celery task: parse and embed a resume."""
    try:
        asyncio.run(_parse_resume_async(resume_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)
