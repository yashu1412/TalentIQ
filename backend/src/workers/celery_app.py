"""Celery application factory and task definitions."""
import os
from dotenv import load_dotenv
load_dotenv(override=True)
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "talentiq",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "src.workers.resume_tasks",
        "src.workers.job_tasks",
        "src.workers.embed_tasks",
        "src.workers.notify_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "src.workers.resume_tasks.*": {"queue": "high"},
        "src.workers.job_tasks.*": {"queue": "high"},
        "src.workers.embed_tasks.*": {"queue": "low"},
        "src.workers.notify_tasks.*": {"queue": "low"},
    },
)
