"""Notification and reminder Celery tasks."""
import os
import asyncio
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from src.workers.celery_app import celery_app
from src.models.live_room import Application
from src.core.db import engine, AsyncSessionLocal



@celery_app.task(name="src.workers.notify_tasks.notify", queue="low", bind=True)
def notify(self, user_id: str, kind: str = "generic", payload: dict | None = None) -> dict:
    return {"user_id": user_id, "kind": kind, "status": "queued", "payload": payload}


async def _send_due_application_reminders_async() -> dict:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Application).where(
                Application.reminder_at.isnot(None),
                Application.reminder_at <= datetime.utcnow(),
                Application.status.notin_(["offer", "rejected"]),
            )
        )
        due = result.scalars().all()
        reminder_payload = [
            {
                "application_id": app.id,
                "user_id": app.user_id,
                "title": app.title,
                "company": app.company,
                "next_step": app.next_step,
                "reminder_at": app.reminder_at.isoformat() if app.reminder_at else None,
            }
            for app in due
        ]
        return {"count": len(reminder_payload), "reminders": reminder_payload}


@celery_app.task(name="src.workers.notify_tasks.send_due_application_reminders", queue="low", bind=True)
def send_due_application_reminders(self) -> dict:
    return asyncio.run(_send_due_application_reminders_async())

