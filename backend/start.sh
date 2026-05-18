#!/bin/bash

# Start Celery worker in the background
celery -A src.workers.celery_app worker --loglevel=info -Q high,default,low &

# Start Celery beat scheduler in the background
celery -A src.workers.celery_app beat --loglevel=info &

# Start FastAPI in the foreground (binding to 0.0.0.0 and the PORT provided by Render)
gunicorn src.main:app --worker-class uvicorn.workers.UvicornWorker --workers 2 --bind 0.0.0.0:$PORT --timeout 120 --keep-alive 5
