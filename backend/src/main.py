import sys
import asyncio
import warnings

# Suppress Pydantic V1 compatibility warning in Python 3.14+
warnings.filterwarnings(
    "ignore",
    message="Core Pydantic V1 functionality isn't compatible with Python 3.14 or greater."
)

# Windows async fix for psycopg/sqlalchemy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import logging
import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.core.db import init_pgvector
from src.core.redis import close_redis
from src.api.auth_router import router as auth_router
from src.api.resume_router import router as resume_router
from src.api.job_router import router as job_router, match_router
from src.api.ai_router import router as ai_router
from src.api.interview_router import router as interview_router
from src.api.live_room_router import router as live_room_router
from src.api.tracker_router import router as tracker_router
from src.api.analytics_router import router as analytics_router
from src.api.group_router import router as group_router
from src.core.feature_flags import feature_flags_dependency

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("SKIP_DB_BOOTSTRAP", "").lower() in ("1", "true", "yes"):
        logger.warning("SKIP_DB_BOOTSTRAP is set; skipping init_pgvector()")
    else:
        async def _init():
            try:
                await init_pgvector()
                logger.info("Database schema initialised successfully.")
            except Exception:
                logger.exception(
                    "Database init failed (non-fatal); API will still serve requests."
                )

        asyncio.create_task(_init())

    yield

    await close_redis()


app = FastAPI(
    title="TalentIQ Career Copilot API",
    version="1.0.0",
    description="AI-powered resume analysis, job matching, mock interviews, and live collaboration.",
    lifespan=lifespan,
)

# ==========================================
# CORS - ALLOW ALL ORIGINS
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False with wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)
# ==========================================


@app.middleware("http")
async def request_observability_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    started = time.perf_counter()

    response = await call_next(request)

    latency_ms = int((time.perf_counter() - started) * 1000)

    response.headers["x-request-id"] = request_id
    response.headers["x-response-time-ms"] = str(latency_ms)

    logger.info(
        "request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
        },
    )

    return response


# Routers
app.include_router(auth_router, prefix="/v1")
app.include_router(resume_router, prefix="/v1")
app.include_router(job_router, prefix="/v1")
app.include_router(match_router, prefix="/v1")
app.include_router(ai_router, prefix="/v1")
app.include_router(interview_router, prefix="/v1")
app.include_router(live_room_router, prefix="/v1")
app.include_router(tracker_router, prefix="/v1")
app.include_router(analytics_router, prefix="/v1")
app.include_router(group_router, prefix="/v1")


# Uploads directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
uploads_dir = os.path.join(BASE_DIR, "uploads")

os.makedirs(uploads_dir, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=uploads_dir),
    name="uploads",
)


@app.get("/")
async def root():
    return {
        "service": "TalentIQ Career Copilot API",
        "version": "1.0.0",
        "status": "healthy",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/v1/platform/flags")
async def get_platform_flags(
    flags: dict = Depends(feature_flags_dependency),
):
    return {"flags": flags}
