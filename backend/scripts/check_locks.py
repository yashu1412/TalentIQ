"""
Helper script to inspect active locks and blocking queries on the PostgreSQL database.
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

print("Checking for blocked/blocking queries...")
try:
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            # Query for locks
            cur.execute("""
                SELECT
                    blocked_l.relation::regclass::text AS locked_table,
                    blocked_a.pid AS blocked_pid,
                    blocked_a.query AS blocked_query,
                    blocked_l.mode AS blocked_mode,
                    blocking_a.pid AS blocking_pid,
                    blocking_a.query AS blocking_query,
                    blocking_l.mode AS blocking_mode
                FROM pg_catalog.pg_locks blocked_l
                JOIN pg_catalog.pg_stat_activity blocked_a ON blocked_a.pid = blocked_l.pid
                JOIN pg_catalog.pg_locks blocking_l 
                    ON (blocking_l.transactionid = blocked_l.transactionid OR blocking_l.relation = blocked_l.relation)
                    AND blocking_l.pid != blocked_l.pid
                JOIN pg_catalog.pg_stat_activity blocking_a ON blocking_a.pid = blocking_l.pid
                WHERE NOT blocked_l.granted;
            """)
            locks = cur.fetchall()
            if not locks:
                print("No blocked queries found.")
            else:
                print(f"\nFound {len(locks)} blocked query/queries:")
                for lock in locks:
                    print(f"Table: {lock[0]}")
                    print(f"  Blocked PID: {lock[1]} | Query: {lock[2][:100]}")
                    print(f"  Blocked Mode: {lock[3]}")
                    print(f"  Blocking PID: {lock[4]} | Query: {lock[5][:100]}")
                    print(f"  Blocking Mode: {lock[6]}")
                    print("-" * 60)

            # Query all active queries
            print("\nListing all active connections and their queries:")
            cur.execute("""
                SELECT pid, state, query, age(clock_timestamp(), query_start) AS duration
                FROM pg_stat_activity
                WHERE state IS NOT NULL AND query NOT LIKE '%pg_stat_activity%'
                ORDER BY duration DESC;
            """)
            activities = cur.fetchall()
            print(f"{'PID':<6} | {'State':<15} | {'Duration':<12} | {'Query'}")
            print("-" * 80)
            for act in activities:
                # Truncate query for display
                q = act[2].replace('\n', ' ')[:80]
                print(f"{act[0]:<6} | {act[1]:<15} | {str(act[3]):<12} | {q}")

except Exception as e:
    print(f"Error checking database activity: {e}")
