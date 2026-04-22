"""Celery application factory and task definitions."""
import os
import logging
from dotenv import load_dotenv
load_dotenv(override=True)
from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure

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
        "src.workers.retention_tasks",
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
        "src.workers.retention_tasks.*": {"queue": "low"},
    },
    beat_schedule={
        "retention-cleanup-hourly": {
            "task": "src.workers.retention_tasks.cleanup_expired_data",
            "schedule": 3600.0,
        },
        "application-reminders-every-15-mins": {
            "task": "src.workers.notify_tasks.send_due_application_reminders",
            "schedule": 900.0,
        },
    },
)

logger = logging.getLogger(__name__)


@task_prerun.connect
def _task_prerun(task_id=None, task=None, args=None, kwargs=None, **extra):
    logger.info("celery_task_start task=%s task_id=%s", getattr(task, "name", "unknown"), task_id)


@task_postrun.connect
def _task_postrun(task_id=None, task=None, state=None, **extra):
    logger.info("celery_task_done task=%s task_id=%s state=%s", getattr(task, "name", "unknown"), task_id, state)


@task_failure.connect
def _task_failure(task_id=None, exception=None, sender=None, **extra):
    logger.error("celery_task_failed task=%s task_id=%s error=%s", getattr(sender, "name", "unknown"), task_id, exception)
