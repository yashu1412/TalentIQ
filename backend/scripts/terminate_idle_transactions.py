"""
Helper script to terminate long-running idle-in-transaction connections.
This prevents ALTER TABLE commands from hanging and timing out.
"""

import os
import sys
from pathlib import Path
import psycopg
from dotenv import load_dotenv

scripts_dir = Path(__file__).parent
backend_dir = scripts_dir.parent
dotenv_path = backend_dir / ".env"

if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    print("Error: .env not found")
    sys.exit(1)

url = os.getenv("DATABASE_URL", "")
dsn = url.replace("postgresql+psycopg_async://", "postgresql://").replace("postgresql+asyncpg://", "postgresql://")

print("Terminating long-running idle-in-transaction connections...")
try:
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            # Query for pids to kill
            cur.execute("""
                SELECT pid, state, age(clock_timestamp(), query_start) AS duration, query
                FROM pg_stat_activity
                WHERE state = 'idle in transaction'
                  AND age(clock_timestamp(), query_start) > interval '5 minutes';
            """)
            targets = cur.fetchall()
            if not targets:
                print("No idle in transaction connections found to terminate.")
            else:
                print(f"Found {len(targets)} connections to terminate:")
                for row in targets:
                    pid, state, duration, query = row
                    print(f"Killing PID {pid} (State: {state}, Duration: {duration}, Query: {query[:60]})")
                    
                cur.execute("""
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE state = 'idle in transaction'
                      AND age(clock_timestamp(), query_start) > interval '5 minutes';
                """)
                terminated = cur.fetchall()
                print(f"Successfully terminated {len(terminated)} connections.")
        conn.commit()
except Exception as e:
    print(f"Error terminating connections: {e}")
