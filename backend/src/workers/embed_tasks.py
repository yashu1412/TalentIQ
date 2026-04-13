"""Embedding Celery tasks (stub).

Currently, resume embeddings are created inside the resume parsing Celery
task (`src/workers/resume_tasks.py`). These stubs ensure Celery can boot
without missing modules.
"""

from src.workers.celery_app import celery_app


@celery_app.task(name="src.workers.embed_tasks.embed_document", queue="low", bind=True)
def embed_document(self, doc_embedding_id: str) -> dict:
    """No-op stub for now."""
    return {"doc_embedding_id": doc_embedding_id, "status": "skipped"}

