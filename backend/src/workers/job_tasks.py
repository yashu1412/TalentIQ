"""Job-analysis Celery tasks.

This repo currently parses job descriptions synchronously inside the API
(`src/api/job_router.py`). These Celery modules exist as stubs so the Celery
worker can start successfully.
"""

from src.workers.celery_app import celery_app


@celery_app.task(name="src.workers.job_tasks.parse_jd", queue="high", bind=True)
def parse_jd(self, job_id: str) -> dict:
    """No-op stub for now."""
    return {"job_id": job_id, "status": "skipped"}

