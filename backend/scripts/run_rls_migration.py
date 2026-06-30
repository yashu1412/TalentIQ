"""
Script to apply the Row Level Security (RLS) SQL migration to the database.
Loads DATABASE_URL from backend/.env, connects using psycopg, and executes enable_rls.sql.
"""

import os
import sys
from pathlib import Path
import psycopg
from dotenv import load_dotenv

# Load backend/.env
scripts_dir = Path(__file__).parent
backend_dir = scripts_dir.parent
dotenv_path = backend_dir / ".env"

if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    print(f"Error: .env file not found at {dotenv_path}")
    sys.exit(1)

url = os.getenv("DATABASE_URL", "")
if not url:
    print("Error: DATABASE_URL not set in environment.")
    sys.exit(1)

# Convert async scheme if present
dsn = (
    url.replace("postgresql+psycopg_async://", "postgresql://")
    .replace("postgresql+asyncpg://", "postgresql://")
)

sql_file_path = scripts_dir / "enable_rls.sql"
if not sql_file_path.exists():
    print(f"Error: SQL migration file not found at {sql_file_path}")
    sys.exit(1)

print(f"Reading migration from {sql_file_path}...")
sql_content = sql_file_path.read_text(encoding="utf-8")

print("Connecting to database...")
try:
    with psycopg.connect(dsn, connect_timeout=15) as conn:
        print("Connected. Executing SQL migration script...")
        with conn.cursor() as cur:
            cur.execute(sql_content)
        conn.commit()
        print("Migration executed and committed successfully.")

        # Verification
        print("\nVerifying Row Level Security status on public tables:")
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT tablename, rowsecurity 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                ORDER BY tablename;
                """
            )
            rows = cur.fetchall()
            print(f"{'Table Name':<30} | {'RLS Enabled':<12}")
            print("-" * 45)
            for row in rows:
                print(f"{row[0]:<30} | {str(row[1]):<12}")

except Exception as e:
    print(f"Error executing migration: {e}")
    sys.exit(1)

print("\nDone.")
