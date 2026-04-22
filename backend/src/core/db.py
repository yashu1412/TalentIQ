import os
import re
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv(override=True)

_raw_url = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg_async://postgres:postgres@localhost:5432/talentiq",
)

# Normalise: any postgresql:// or postgresql+psycopg:// → postgresql+psycopg_async://
# so the async engine always gets the correct psycopg3 async driver.
def _to_async_url(url: str) -> str:
    from urllib.parse import urlparse, urlunparse
    if not url:
        return url
    # Handle quoted strings if the user added them
    url = url.strip("'\"")
    
    parsed = urlparse(url)
    
    # Ensure scheme is postgresql+psycopg_async
    # and handle cases where user gave postgres://
    new_scheme = parsed.scheme
    if new_scheme in ["postgres", "postgresql", "postgresql+psycopg"]:
        new_scheme = "postgresql+psycopg_async"
    
    # Rebuild URL with the correct scheme
    url = urlunparse((
        new_scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        parsed.query,
        parsed.fragment
    ))
    return url

DATABASE_URL = _to_async_url(_raw_url)




# Use connect_args to ensure SSL is enabled for cloud providers like Supabase/Neon
engine = create_async_engine(
    DATABASE_URL, 
    echo=False, 
    pool_pre_ping=True,
    connect_args={"sslmode": "require"} if "localhost" not in DATABASE_URL else {}
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()



async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_pgvector():
    """Ensure the pgvector extension and all tables are created."""
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    # Import all models to register them with Base before create_all
    from src.models import (  # noqa: F401
        User, UserProfile, Resume, ResumeVersion,
        Job, JobMatch, Interview, InterviewQuestion,
        LiveRoom, Chat, ChatMessage, Application,
        Group, GroupMessage,
        DocumentEmbedding,
    )
    async with engine.begin() as conn:
        # 1. Create all tables defined in models first
        await conn.run_sync(Base.metadata.create_all)
        
    async with engine.begin() as conn:
        # 2. Apply optional schema updates (for development transitions)
        try:
            # For production, always use Alembic migrations.
            await conn.execute(text("ALTER TABLE groups ADD COLUMN IF NOT EXISTS shared_code TEXT"))
            await conn.execute(text("ALTER TABLE groups ADD COLUMN IF NOT EXISTS shared_language VARCHAR(32)"))
            await conn.execute(text("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP"))
            await conn.execute(text("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS retention_tag VARCHAR(32) DEFAULT 'standard'"))
            await conn.execute(text("ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP"))
            await conn.execute(text("ALTER TABLE live_rooms ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP"))
            await conn.execute(text("ALTER TABLE live_rooms ADD COLUMN IF NOT EXISTS retention_tag VARCHAR(32) DEFAULT 'standard'"))
            await conn.execute(text("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP"))
            await conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS title VARCHAR(255)"))
            await conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS company VARCHAR(255)"))
            await conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS next_step TEXT"))
            await conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMP"))
            await conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT NOW()"))
            await conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS persona VARCHAR(32) DEFAULT 'balanced'"))
            await conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS replay_json JSON"))
        except Exception:
            # Swallow errors here to allow startup to continue
            pass

