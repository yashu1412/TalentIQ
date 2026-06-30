"""
Script to fix the "Extension in Public" warning for pgvector.
Moves the 'vector' extension to the 'extensions' schema,
and ensures that the 'extensions' schema is in the database search path.
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

try:
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            # 1. Check current search path
            cur.execute("SHOW search_path;")
            current_path = cur.fetchone()[0]
            print(f"Current search_path: {current_path}")

            # 2. Get database name
            cur.execute("SELECT current_database();")
            db_name = cur.fetchone()[0]
            print(f"Database name: {db_name}")

            # 3. Create extensions schema if not exists
            print("Creating 'extensions' schema if not exists...")
            cur.execute("CREATE SCHEMA IF NOT EXISTS extensions;")

            # 4. Check where 'vector' extension is installed
            cur.execute("""
                SELECT n.nspname 
                FROM pg_extension e 
                JOIN pg_namespace n ON e.extnamespace = n.oid 
                WHERE e.extname = 'vector';
            """)
            row = cur.fetchone()
            if not row:
                print("Extension 'vector' is not installed yet.")
            else:
                current_schema = row[0]
                print(f"Extension 'vector' is currently installed in schema: {current_schema}")
                
                if current_schema != 'extensions':
                    print("Moving 'vector' extension to 'extensions' schema...")
                    cur.execute("ALTER EXTENSION vector SET SCHEMA extensions;")
                    print("Extension 'vector' moved successfully.")
                else:
                    print("Extension 'vector' is already in the 'extensions' schema.")

            # 5. Ensure search_path contains 'extensions'
            paths = [p.strip() for p in current_path.split(',')]
            if 'extensions' not in paths:
                print("Adding 'extensions' to the database search path...")
                # We append extensions to the path. Note: we preserve original paths.
                new_path = current_path + ", extensions"
                cur.execute(f'ALTER DATABASE "{db_name}" SET search_path TO {new_path};')
                print(f"Database search_path updated to: {new_path}")
            else:
                print("'extensions' is already in the search path.")

        conn.commit()
        print("\nAll changes committed successfully.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

print("Done.")
