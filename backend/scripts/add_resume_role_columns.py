"""
One-shot migration: add target_role and experience_level columns to the resumes table.
Uses psycopg (sync) so it works without asyncpg.
Run from the backend directory:
    python scripts/add_resume_role_columns.py
"""

import os, sys
from pathlib import Path

# Load .env
env_path = Path(__file__).parent.parent / ".env"
for line in env_path.read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())

raw_url = os.environ["DATABASE_URL"]

# Convert SQLAlchemy async URL to plain psycopg conninfo
# postgresql+psycopg_async://user:pass@host:port/db -> host= user= ...
import re
m = re.match(
    r"postgresql\+psycopg(?:_async)?://([^:]+):([^@]+)@([^:/]+):(\d+)/(.+)",
    raw_url,
)
if not m:
    sys.exit(f"Could not parse DATABASE_URL: {raw_url}")

user, password, host, port, dbname = m.groups()
import urllib.parse
password = urllib.parse.unquote(password)

import psycopg  # psycopg v3 (sync)

conninfo = f"host={host} port={port} dbname={dbname} user={user} password={password} sslmode=require"

COLUMNS = [
    ("target_role",      "VARCHAR(64)",  "'Software Engineer'"),
    ("experience_level", "VARCHAR(16)",  "'fresher'"),
]

with psycopg.connect(conninfo) as conn:
    with conn.cursor() as cur:
        for col, dtype, default in COLUMNS:
            cur.execute(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name='resumes' AND column_name=%s",
                (col,),
            )
            if cur.fetchone():
                print(f"  [skip]  resumes.{col} already exists")
            else:
                cur.execute(
                    f"ALTER TABLE resumes ADD COLUMN {col} {dtype} DEFAULT {default}"
                )
                print(f"  [added] resumes.{col} {dtype} DEFAULT {default}")
    conn.commit()

print("Done.")
