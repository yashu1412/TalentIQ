# TalentIQ Interview Answers

Based on the `talent-IQ-master` codebase, here are the detailed answers to your questions.

## 🔹 FastAPI (From TalentIQ)

**How does FastAPI handle dependency injection? Give a real-world example.**
FastAPI uses the `Depends()` function to declare dependencies that are evaluated before the route handler runs. 
*Real-world example from TalentIQ:* In `api/ai_router.py`, routes use `db: AsyncSession = Depends(get_db)` to inject a database session, and `user: User = Depends(get_current_user)` to automatically verify the Clerk JWT and inject the authenticated user into the request context.

**What is `async def` vs `def` in FastAPI routes — when do you use each?**
- `async def`: Used for almost all routes in TalentIQ because the project uses asynchronous database drivers (`sqlalchemy.ext.asyncio` with `psycopg3`). It allows the server to handle other requests while waiting for I/O operations (like DB queries or LLM API calls).
- `def`: Used for purely synchronous operations. For instance, in `core/auth.py`, `verify_clerk_webhook` is a normal `def` because it just does synchronous cryptographic validation using the Svix library without any I/O blocking.

**How do you implement JWT authentication in FastAPI?**
TalentIQ delegates user management to **Clerk**. In `core/auth.py`, the `get_current_user` dependency intercepts the `Authorization: Bearer <token>` header. It uses the `python-jose` library (`jwt.decode`) alongside `CLERK_JWT_PUBLIC_KEY` to cryptographically verify the token signature. If valid, it queries the database for the user or auto-creates them.

**What is Pydantic and how does it integrate with FastAPI for request validation?**
Pydantic is a data parsing and validation library. FastAPI natively uses Pydantic models to define request bodies and response schemas. While some rapid-iteration endpoints in TalentIQ (like `/copilot/chat`) accept a raw `payload: dict`, the framework allows you to define strict Pydantic classes to automatically validate incoming JSON, return 422 Unprocessable Entity on validation failure, and generate Swagger/OpenAPI documentation.

**How does FastAPI's background tasks differ from Celery? When would you use Celery instead?**
- **FastAPI BackgroundTasks** run in the same event loop and memory space as the web server. They disappear if the server restarts. 
- **Celery** (used heavily in TalentIQ) runs in separate worker processes with a message broker (Redis). TalentIQ uses Celery for heavy tasks like **resume PDF parsing and ATS scoring** (`parse_resume`). Celery is used here because parsing PDFs (`PyMuPDF`) is CPU-heavy and would block the web server, and it provides durability, retries, and distributed scaling.

**What is SSE (Server-Sent Events) and how did you implement real-time streaming in FastAPI?**
SSE is a protocol that allows the server to push real-time updates to the client over a single HTTP connection. In TalentIQ's AI Copilot (`api/ai_router.py`), it is used to stream LLM responses token-by-token. This is implemented via a Python asynchronous generator function (`async def stream_response()`) that yields formatted strings like `yield f"data: {json.dumps(...)}\n\n"`. FastAPI's `StreamingResponse` then wraps this generator with `media_type="text/event-stream"`.

**How do you structure a large FastAPI project with multiple routers and modules?**
TalentIQ uses FastAPI's `APIRouter` to keep things modular. The `backend/src/` folder is structured as:
- `api/`: Route handlers grouped by domain (`ai_router.py`, `job_router.py`).
- `core/`: Global configurations, DB connection, and security/auth logic.
- `models/`: SQLAlchemy ORM database models.
- `services/`: Reusable business logic (e.g., `scoring_service.py`).
- `workers/`: Celery task definitions.
The routers are then combined and mounted in `main.py`.

---

## 🔹 Celery + Redis (From TalentIQ)

**What is Celery and why did you use it with Redis in TalentIQ?**
Celery is an asynchronous task queue/job queue based on distributed message passing. TalentIQ uses it with Redis to offload heavy lifting—like extracting text from PDFs (`fitz`), hitting OpenAI embedding APIs, and calculating ATS scores—so the main FastAPI web server remains snappy and responsive.

**What is the difference between a Celery task and a chord or chain?**
- **Task**: A single, independent unit of work (like `parse_resume`).
- **Chain**: A sequence of tasks where the output of Task A becomes the input of Task B.
- **Chord**: Executes a group of tasks in parallel, and then fires a final callback task when all parallel tasks are complete.

**How do you handle task retries and failure propagation in Celery?**
In `workers/resume_tasks.py`, the task is decorated with `@celery_app.task(max_retries=3)`. Inside the `try/except` block, if an error occurs (like an API timeout), it calls `raise self.retry(exc=exc, countdown=30)`. This safely catches the failure, propagates it to the broker, and schedules the task to run again in 30 seconds.

**What role does Redis play as a message broker vs a cache?**
In TalentIQ, Redis acts primarily as the **message broker** (storing the queue of tasks waiting for Celery workers to pick up) and the **result backend** (storing the success/failure state of those tasks). While it can also be used as a cache for frequent DB queries, the Celery configuration in `celery_app.py` directly binds `REDIS_URL` as both broker and backend.

---

## 🔹 RAG & AI Integration (From TalentIQ)

**What is RAG (Retrieval-Augmented Generation)? How did you implement it?**
RAG improves LLM accuracy by retrieving factual, custom data from a database and injecting it into the prompt. In TalentIQ, when a user talks to the Copilot, the backend dynamically fetches their latest parsed resume (`parsed_json`) and injects up to 3000 characters of it into the system prompt context, grounding the AI's career advice in the user's actual skills and experience.

**What is a vector embedding and how is it used in document retrieval?**
A vector embedding is a high-dimensional array of floats (e.g., `[0.01, -0.05, ...]`) representing the semantic meaning of text. TalentIQ uses `openai/text-embedding-ada-002` (1536 dimensions) to turn resume chunks and portfolio artifacts into vectors, storing them in PostgreSQL using the `pgvector` extension (in the `DocumentEmbedding` model).

**How do you chunk and preprocess documents before storing them in a vector store?**
In `workers/resume_tasks.py`, the `chunk_text` function uses a **sliding window over word tokens**. It breaks the text into chunks of 512 words, with an overlap of 64 words between chunks. This overlap ensures that semantic context isn't lost at the strict boundary between chunks.

**What are the tradeoffs between different similarity search methods (cosine, dot product, etc.)?**
- **Cosine Similarity**: Measures the angle between two vectors, ignoring their magnitude. Best for normalized text embeddings (like OpenAI's) because it focuses purely on semantic direction.
- **Dot Product**: Measures both angle and magnitude. It's computationally cheaper but requires vectors to be normalized to behave like cosine similarity.
- **L2 / Euclidean Distance**: Measures straight-line distance. Useful for clustering but less intuitive for purely semantic text search compared to cosine.

---

## 🔹 Database & ORM (PostgreSQL, SQLAlchemy)

**How do you use Python to interact with PostgreSQL — raw SQL vs ORM? What are the tradeoffs?**
TalentIQ predominantly uses the **SQLAlchemy ORM** (e.g., `await db.execute(select(Resume).where(...))`). 
- **ORM Tradeoffs**: Pros: Type safety, easy relationship mapping (`user.resumes`), and highly readable code. Cons: Slight performance overhead and complex queries can be hard to write.
- **Raw SQL Tradeoffs**: Used in TalentIQ for migrations or database bootstrapping (`await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))`). Pros: Maximum performance and access to PostgreSQL-specific syntax. Cons: Susceptible to SQL injection if not careful and harder to maintain.

**What is connection pooling and why is it important in an async FastAPI app?**
Connection pooling maintains a cache of active database connections (configured via `create_async_engine(pool_pre_ping=True)`). In an async app, hundreds of concurrent requests might try to hit the DB simultaneously. A pool ensures connections are reused efficiently rather than opening/closing a connection per request (which is incredibly slow), while preventing the database from being overwhelmed by too many simultaneous connections.

**How would you handle database migrations in a FastAPI + PostgreSQL project?**
TalentIQ uses **Alembic** (the standard migration tool for SQLAlchemy). Alembic tracks changes to the SQLAlchemy models and auto-generates up/down migration scripts. These scripts are run via the CLI (`alembic upgrade head`) during deployment to safely apply schema changes without data loss.

---

## 🔹 System Design & Best Practices

**How did you design the async task queue in TalentIQ to handle 15+ PostgreSQL tables without bottlenecks?**
1. **Queue Prioritization**: Celery routes are configured so `parse_resume` tasks go to a `"high"` priority queue, while background tasks like `embed_document` go to a `"low"` queue.
2. **Offloading CPU bounds**: Inside the async Celery tasks, heavy synchronous operations (like PyMuPDF's `extract_text_from_pdf` and `base64decode`) are offloaded using `asyncio.to_thread()`, ensuring the worker's event loop isn't blocked.
3. **Optimistic UI Updates**: The DB is immediately committed with `parse_status="done"` *before* the slower vector embeddings run, unblocking the frontend immediately.

**If TalentIQ needed to scale to 100K users, what Python-side changes would you make?**
1. **PgBouncer**: Implement connection pooling at the infrastructure level. 100K users will exhaust PostgreSQL's max connection limits if every FastAPI pod maintains its own large SQLAlchemy pool.
2. **Dedicated Worker Nodes**: Separate Celery workers by queue onto different servers. Have high-CPU nodes dedicated strictly to PDF extraction and lower-tier nodes for API calls (OpenAI).
3. **Redis Caching**: Add application-level caching via Redis for static heavy endpoints (e.g., caching the static roadmap or global job options) to reduce DB load.
