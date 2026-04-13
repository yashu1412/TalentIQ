"""One-off: verify backend/.env connectivity. Run: py scripts/verify_env.py from backend/"""
import asyncio
import os
import selectors
import sys

from dotenv import load_dotenv

# Load backend/.env whether run from backend/ or repo root
_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.dirname(_here)
load_dotenv(os.path.join(_backend, ".env"))


def mask(s: str) -> str:
    if not s or len(s) < 24:
        return "(set)"
    return s[:12] + "..." + s[-8:]


async def check_pg() -> None:
    url = os.getenv("DATABASE_URL", "")
    if not url:
        print("POSTGRES: FAIL - DATABASE_URL missing")
        return
    dsn = (
        url.replace("postgresql+psycopg_async://", "postgresql://")
        .replace("postgresql+asyncpg://", "postgresql://")
    )
    try:
        import psycopg

        async with await psycopg.AsyncConnection.connect(dsn, connect_timeout=15) as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
                r = await cur.fetchone()
                await cur.execute(
                    "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
                )
                v = (await cur.fetchone())[0]
        print("POSTGRES: OK - connected, SELECT 1 =", r[0])
        print(
            "PGVECTOR:",
            "installed" if v else "NOT installed (Neon: enable pgvector or run CREATE EXTENSION vector)",
        )
    except Exception as e:
        print("POSTGRES: FAIL -", type(e).__name__, str(e)[:220])


def check_redis() -> None:
    url = os.getenv("REDIS_URL", "")
    if not url:
        print("REDIS: SKIP - REDIS_URL missing")
        return
    try:
        import redis

        r = redis.Redis.from_url(url, socket_connect_timeout=5)
        ok = r.ping()
        print("REDIS: OK - PING =", ok)
    except Exception as e:
        print("REDIS: FAIL -", type(e).__name__, str(e)[:220])


def check_keys() -> None:
    keys = ["CLERK_SECRET_KEY", "OPENAI_API_KEY", "STREAM_API_KEY", "STREAM_API_SECRET"]
    for k in keys:
        v = os.getenv(k, "")
        print(f"{k}:", f"set ({mask(v)})" if v else "MISSING")


def main() -> int:
    # Windows: Psycopg async requires SelectorEventLoop, not ProactorEventLoop.
    if sys.platform == "win32":
        asyncio.run(
            check_pg(),
            loop_factory=lambda: asyncio.SelectorEventLoop(selectors.SelectSelector()),
        )
    else:
        asyncio.run(check_pg())
    check_redis()
    check_keys()
    print("PISTON_URL:", os.getenv("PISTON_URL", "MISSING"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
