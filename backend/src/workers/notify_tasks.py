"""Notification Celery tasks (stub).

Notifications are not wired in this prototype yet; these stubs prevent
Celery startup failures due to missing task modules.
"""

from src.workers.celery_app import celery_app


@celery_app.task(name="src.workers.notify_tasks.notify", queue="low", bind=True)
def notify(self, user_id: str, kind: str = "generic", payload: dict | None = None) -> dict:
    """No-op stub for now."""
    return {"user_id": user_id, "kind": kind, "status": "skipped", "payload": payload}

