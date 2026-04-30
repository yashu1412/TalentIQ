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
from src.services.scoring_service import calculate_ats_score, extract_resume_data

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


async def _generate_embeddings_async(resume_id: str, user_id: str, raw_text: str):
    """Fire-and-forget: generate embeddings after resume is already marked done."""
    try:
        chunks = chunk_text(raw_text)
        if not chunks:
            return
        embeddings = await get_embeddings(chunks[:20])  # cap at 20 chunks for cost
        async with AsyncSessionLocal() as db:
            for idx, (chunk, emb) in enumerate(zip(chunks[:20], embeddings)):
                doc_emb = DocumentEmbedding(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    doc_type="resume",
                    doc_id=resume_id,
                    chunk_index=idx,
                    content=chunk,
                    embedding=emb,
                    metadata_json={"section": "full", "source": "resume"},
                )
                db.add(doc_emb)
            await db.commit()
        logger.info("resume_embeddings_done resume_id=%s", resume_id)
    except Exception as e:
        logger.warning("Embedding generation failed for resume_id=%s: %s", resume_id, e)


async def _parse_resume_async(resume_id: str, target_role: str = "fullstack_developer", experience_level: str = "fresher"):
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
            # Run in thread — base64 decode of large PDFs is CPU-bound
            file_bytes = await asyncio.to_thread(base64.b64decode, b64)
        else:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(file_url)
                file_bytes = resp.content

        # --- Step 1: Extract text (non-blocking — offloaded to thread pool) ---
        # PyMuPDF (fitz) is synchronous; running it inline blocks the event loop
        # and prevents FastAPI from serving the frontend's status-poll requests.
        raw_text = await asyncio.to_thread(extract_text_from_pdf, file_bytes)
        resume.raw_text = raw_text

        # --- Step 2: Parse sections (fast, local heuristic) ---
        parsed = extract_resume_data(raw_text)

        # --- Step 3: ATS scoring with user-selected role + level ---
        # Map frontend level names to scoring service internal names
        level_map = {"fresher": "fresher", "intermediate": "mid", "advanced": "senior"}
        scoring_level = level_map.get(experience_level, "fresher")
        scoring_result = calculate_ats_score(raw_text, role=target_role, level=scoring_level)
        logger.info("ATS scoring complete resume_id=%s role=%s level=%s score=%s",
                    resume_id, target_role, scoring_level, scoring_result["final_score"])

        parsed["ats_breakdown"] = scoring_result["breakdown"]
        resume.parsed_json = parsed
        resume.ats_score = int(scoring_result["final_score"])
        resume.quality_score = min(100, int(scoring_result["final_score"] + scoring_result["breakdown"]["formatting"]))

        # --- Step 4: Mark done immediately so UI unblocks ---
        resume.parse_status = "done"
        await db.commit()
        logger.info("resume_parse_done resume_id=%s", resume_id)

    # --- Step 5: Generate embeddings (runs after DB shows "done", UI already unblocked) ---
    # We await directly instead of ensure_future: in the Celery path asyncio.run()
    # cancels outstanding futures before they execute, so fire-and-forget is a no-op there.
    # Awaiting here works in both paths — the frontend already sees "done" from the DB commit above.
    await _generate_embeddings_async(resume_id, resume.user_id, raw_text)


@celery_app.task(name="src.workers.resume_tasks.parse_resume", queue="high", bind=True, max_retries=3)
def parse_resume(self, resume_id: str, target_role: str = "fullstack_developer", experience_level: str = "fresher"):
    """Celery task: parse and embed a resume."""
    try:
        asyncio.run(_parse_resume_async(resume_id, target_role, experience_level))
    except Exception as exc:
        logger.exception("resume_parse_retry resume_id=%s error=%s", resume_id, exc)
        raise self.retry(exc=exc, countdown=30)
