"""Resume parse + embed Celery tasks."""
import asyncio
import os
import uuid
import logging
import httpx
import fitz  # PyMuPDF
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from src.workers.celery_app import celery_app
from src.models.resume import Resume
from src.models.embeddings import DocumentEmbedding
from src.core.db import engine, AsyncSessionLocal
from src.core.openrouter_client import get_openrouter_client, OR_DEFAULT_MODEL

logger = logging.getLogger(__name__)



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
    """Generate embeddings via OpenRouter (OpenAI-compatible endpoint)."""
    client = get_openrouter_client()
    response = await client.embeddings.create(
        model="openai/text-embedding-ada-002", input=texts
    )
    return [d.embedding for d in response.data]


async def _parse_resume_async(resume_id: str):
    logger.info("resume_parse_start resume_id=%s", resume_id)
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

        # LLM parse sections via OpenRouter
        oai = get_openrouter_client()
        parse_prompt = f"""
Parse this resume and return a JSON with keys:
skills (list of strings), experience (list of dicts with company/role/duration/bullets),
education (list of dicts with school/degree/year), projects (list of dicts with name/tech/description).
Resume text:
{raw_text[:8000]}
"""
        chat_resp = await oai.chat.completions.create(
            model=OR_DEFAULT_MODEL,  # uses Gemini or OpenRouter depending on env
            messages=[
                {"role": "system", "content": "You are a resume parsing expert. Return only valid JSON."},
                {"role": "user", "content": parse_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=1500,  # cap to stay within OpenRouter free-tier (4000 tokens)
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
        logger.info("resume_parse_done resume_id=%s", resume_id)


@celery_app.task(name="src.workers.resume_tasks.parse_resume", queue="high", bind=True, max_retries=3)
def parse_resume(self, resume_id: str):
    """Celery task: parse and embed a resume."""
    try:
        asyncio.run(_parse_resume_async(resume_id))
    except Exception as exc:
        logger.exception("resume_parse_retry resume_id=%s error=%s", resume_id, exc)
        raise self.retry(exc=exc, countdown=30)
