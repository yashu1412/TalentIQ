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
from fastapi.responses import JSONResponse
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
from src.api.autobot_router import router as autobot_router
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

def _get_allowed_origins() -> list[str]:
    """
    CORS policy:
    - Allow explicit origins from CORS_ALLOW_ORIGINS (comma-separated)
    - If CORS_ALLOW_ALL=true, allow all origins
    - Keep Vercel app origin whitelisted by default
    """
    allow_all = os.getenv("CORS_ALLOW_ALL", "").strip().lower() in ("1", "true", "yes")
    if allow_all:
        return ["*"]

    explicit = os.getenv("CORS_ALLOW_ORIGINS", "")
    origins = [origin.strip() for origin in explicit.split(",") if origin.strip()]
    defaults = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://talent-iq-yrp.vercel.app",
    ]
    for origin in defaults:
        if origin not in origins:
            origins.append(origin)
    return origins


allowed_origins = _get_allowed_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CORS configured", extra={"allowed_origins": allowed_origins})


@app.middleware("http")
async def request_observability_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:
        latency_ms = int((time.perf_counter() - started) * 1000)
        logger.exception(
            "unhandled_request_error",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "latency_ms": latency_ms,
                "error": str(exc),
            },
        )
        response = JSONResponse(
            status_code=500,
            content={
                "detail": "Internal Server Error",
                "request_id": request_id,
            },
        )

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
app.include_router(autobot_router, prefix="/v1")


# Uploads directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
uploads_dir = os.path.join(BASE_DIR, "uploads")

try:
    os.makedirs(uploads_dir, exist_ok=True)
except PermissionError:
    # Fallback to a temporary directory if /app/uploads is not writable (e.g. read-only filesystem)
    import tempfile
    uploads_dir = os.path.join(tempfile.gettempdir(), "talentiq_uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    logger.warning(
        f"Permission denied on {os.path.join(BASE_DIR, 'uploads')}. "
        f"Falling back to temporary directory: {uploads_dir}"
    )

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
