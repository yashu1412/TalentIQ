#!/bin/bash

# Start Celery worker in the background (concurrency=1 to save memory)
celery -A src.workers.celery_app worker --loglevel=info --concurrency=1 -Q high,default,low &

# Start Celery beat scheduler in the background
celery -A src.workers.celery_app beat --loglevel=info &

# Start FastAPI in the foreground (binding to 0.0.0.0 and the PORT provided by Render)
uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}

