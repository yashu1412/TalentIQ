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
    # Replace scheme variants
    url = re.sub(r'^postgresql(\+psycopg2?)?://', 'postgresql+psycopg_async://', url)
    # If already async, leave as-is
    return url

DATABASE_URL = _to_async_url(_raw_url)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
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
        # Check if we need to add columns to existing groups table
        try:
            # This is a basic way to handle dynamic schema updates in dev
            # For production, always use Alembic migrations.
            await conn.execute(text("ALTER TABLE groups ADD COLUMN IF NOT EXISTS shared_code TEXT"))
            await conn.execute(text("ALTER TABLE groups ADD COLUMN IF NOT EXISTS shared_language VARCHAR(32)"))
        except Exception:
            pass
            
        await conn.run_sync(Base.metadata.create_all)
