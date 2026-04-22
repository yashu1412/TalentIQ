"""Data retention cleanup tasks."""
import os
import asyncio
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from src.workers.celery_app import celery_app
from src.core.db import engine



async def _cleanup_expired_data_async() -> dict:
    async with engine.begin() as conn:
        resumes_deleted = await conn.execute(text("DELETE FROM resumes WHERE expires_at IS NOT NULL AND expires_at < NOW()"))
        embeddings_deleted = await conn.execute(text("DELETE FROM document_embeddings WHERE expires_at IS NOT NULL AND expires_at < NOW()"))
        messages_deleted = await conn.execute(text("DELETE FROM chat_messages WHERE expires_at IS NOT NULL AND expires_at < NOW()"))
        rooms_deleted = await conn.execute(text("DELETE FROM live_rooms WHERE expires_at IS NOT NULL AND expires_at < NOW()"))
    return {
        "completed_at": datetime.utcnow().isoformat(),
        "resumes_deleted": resumes_deleted.rowcount or 0,
        "embeddings_deleted": embeddings_deleted.rowcount or 0,
        "messages_deleted": messages_deleted.rowcount or 0,
        "rooms_deleted": rooms_deleted.rowcount or 0,
    }


@celery_app.task(name="src.workers.retention_tasks.cleanup_expired_data", queue="low", bind=True)
def cleanup_expired_data(self) -> dict:
    return asyncio.run(_cleanup_expired_data_async())
