"""AI Copilot: chat, cover letter, roadmap, question generation."""
import uuid
import os
import json
import re
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.db import get_db, AsyncSessionLocal
from src.core.auth import get_current_user
from src.core.feature_flags import require_feature
from src.core.openrouter_client import get_openrouter_client, OR_DEFAULT_MODEL, llm_create
from src.data.roadmap_data import get_static_roadmap, JOB_TITLES, LEVELS
from src.models.live_room import Chat, ChatMessage
from src.models.resume import Resume
from src.models.job import Job
from src.models.embeddings import DocumentEmbedding
from src.models.user import User

router = APIRouter(prefix="/copilot", tags=["copilot"])


def _extract_json(text: str) -> dict:
    """Robustly extract JSON from LLM response, stripping markdown fences."""
    # Remove ```json ... ``` or ``` ... ``` blocks
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        text = match.group(1)
    # Try to find a top-level JSON object if no fences
    obj_match = re.search(r"\{.*\}", text, re.DOTALL)
    if obj_match:
        text = obj_match.group(0)
    return json.loads(text)


async def _detect_intent(message: str) -> str:
    """Fast LLM classifier to route to the right chain."""
    try:
        resp = await llm_create(
            messages=[
                {
                    "role": "system",
                    "content": "Classify the user intent as one of: resume_improve, cover_letter, interview_prep, roadmap, linkedin_summary, networking_message, negotiation_script, company_prep, general. Return only the label.",
                },
                {"role": "user", "content": message},
            ],
            max_tokens=15,
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        return "general"  # safe default if intent detection fails



@router.post("/chat")
async def copilot_chat(
    payload: dict,
    _: None = Depends(require_feature("copilot_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """SSE streaming AI mentor response."""
    message = payload.get("message", "")
    chat_id = payload.get("chat_id")
    context = payload.get("context", {})

    # Get or create chat session
    if chat_id:
        result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == user.id))
        chat = result.scalar_one_or_none()
    else:
        chat = Chat(id=str(uuid.uuid4()), user_id=user.id, conversation_type="mentor")
        db.add(chat)
        await db.flush()
        chat_id = chat.id

    # Save user message
    user_msg = ChatMessage(
        id=str(uuid.uuid4()),
        chat_id=chat_id,
        role="user",
        content=message,
    )
    db.add(user_msg)
    await db.commit()

    # Gather context
    context_parts = [f"User: {user.full_name}"]
    if user.profile and user.profile.skills_summary:
        context_parts.append(f"Profile Skills: {user.profile.skills_summary}")

    # Fetch latest parsed resume for the user to inject into prompt context
    r_result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user.id)
        .order_by(Resume.created_at.desc())
        .limit(1)
    )
    latest_resume = r_result.scalar_one_or_none()
    if latest_resume and latest_resume.parsed_json:
        # Pass up to ~3000 chars of the parsed JSON to the LLM to provide resume context
        resume_context = json.dumps(latest_resume.parsed_json)
        context_parts.append(f"Candidate's Actual Resume Data: {resume_context[:3000]}")

    intent = await _detect_intent(message)
    system_prompt = (
        "You are TalentIQ Career Copilot — an expert AI career mentor. "
        "Provide specific, actionable career advice. "
        f"Primary intent: {intent}. "
        "Context: " + " | ".join(context_parts)
    )

    oai = get_openrouter_client()

    async def stream_response():
        full_response = ""
        try:
            stream = await oai.chat.completions.create(
                model=OR_DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                max_tokens=4500,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else ""
                if delta:
                    full_response += delta
                    # The frontend expects standard JSON object streamed.
                    yield f"data: {json.dumps({'delta': delta, 'intent': intent})}\n\n"
            yield "data: [DONE]\n\n"

            # Save assistant message
            if full_response.strip():
                async with AsyncSessionLocal() as new_session:
                    asst_msg = ChatMessage(
                        id=str(uuid.uuid4()),
                        chat_id=chat_id,
                        role="assistant",
                        content=full_response,
                    )
                    new_session.add(asst_msg)
                    await new_session.commit()
        except Exception as e:
            # Prevent ERR_INCOMPLETE_CHUNKED_ENCODING by yielding an error payload seamlessly
            print(f"Streaming Exception: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")


@router.post("/cover-letter")
async def generate_cover_letter(
    payload: dict,
    _: None = Depends(require_feature("copilot_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume_id = payload.get("resume_id")
    job_id = payload.get("job_id")
    tone = payload.get("tone", "formal")

    resume_text, jd_text = "", ""
    if resume_id:
        r = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
        resume = r.scalar_one_or_none()
        if resume:
            resume_text = json.dumps(resume.parsed_json or {})[:3000]
    if job_id:
        j = await db.execute(select(Job).where(Job.id == job_id))
        job = j.scalar_one_or_none()
        if job:
            jd_text = job.jd_text[:3000]

    prompt = f"""Write a {tone} cover letter for this candidate applying to the job.
Candidate resume: {resume_text}
Job description: {jd_text}
Write a compelling 3-paragraph cover letter."""

    resp = await llm_create(
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
    )
    cover_letter = resp.choices[0].message.content
    return {"cover_letter": cover_letter, "word_count": len(cover_letter.split())}


@router.post("/roadmap")
async def generate_roadmap(
    payload: dict,
    _: None = Depends(require_feature("roadmap_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_role = payload.get("target_role", "Software Engineer")
    level = payload.get("level", "beginner").lower()
    timeline_weeks = 12  # fixed — derived from level data
    resume_id = payload.get("resume_id")

    skills_gap = ""
    if resume_id:
        r = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
        resume = r.scalar_one_or_none()
        if resume and resume.parsed_json:
            skills_gap = f"Current skills: {resume.parsed_json.get('skills', [])}"

    # Try LLM first
    try:
        prompt = f"""Create a 12-week {level} learning roadmap to become a {target_role}.
{skills_gap}
Return JSON with: weeks (list of {{week: int, topics: list, resources: list}})."""
        resp = await llm_create(
            messages=[
                {"role": "system", "content": "Return only valid JSON. Do not include markdown formatting."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1500,
        )
        return _extract_json(resp.choices[0].message.content)
    except Exception:
        pass  # fall through to static data

    # Static fallback
    static = get_static_roadmap(target_role, level)
    if static:
        return static

    raise HTTPException(status_code=503, detail="Roadmap service temporarily unavailable. Try again in a minute.")


@router.get("/roadmap/options")
async def roadmap_options():
    """Return available job titles and levels for the frontend dropdowns."""
    return {"job_titles": JOB_TITLES, "levels": LEVELS}


@router.post("/questions")
async def generate_interview_questions(
    payload: dict,
    _: None = Depends(require_feature("copilot_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    interview_type = payload.get("type", "technical")
    count = min(payload.get("count", 8), 20)
    resume_id = payload.get("resume_id")
    job_id = payload.get("job_id")

    context = ""
    if resume_id:
        r = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
        resume = r.scalar_one_or_none()
        if resume and resume.parsed_json:
            context += f"Candidate skills: {resume.parsed_json.get('skills', [])}\n"
    if job_id:
        j = await db.execute(select(Job).where(Job.id == job_id))
        job = j.scalar_one_or_none()
        if job:
            context += f"Job: {job.title} at {job.company}\n"

    oai = get_openrouter_client()
    prompt = f"""Generate {count} {interview_type} interview questions.
{context}
Return JSON with: questions (list of {{id, text, difficulty, category}})."""

    resp = await oai.chat.completions.create(
        model=OR_DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": "Return only valid JSON. Do not include markdown formatting."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1500,
    )
    data = _extract_json(resp.choices[0].message.content)
    # Ensure UUIDs
    for q in data.get("questions", []):
        if not q.get("id"):
            q["id"] = str(uuid.uuid4())
    return data


@router.post("/writing-assistant")
async def writing_assistant(
    payload: dict,
    _: None = Depends(require_feature("copilot_enabled")),
    user: User = Depends(get_current_user),
):
    task = payload.get("task", "linkedin_summary")
    context = payload.get("context", "")
    oai = get_openrouter_client()
    prompt = (
        f"User task: {task}\n"
        f"Context: {context}\n"
        "Generate a concise output plus 3 alternatives."
    )
    resp = await oai.chat.completions.create(
        model=OR_DEFAULT_MODEL,
        messages=[{"role": "system", "content": "You are a career writing assistant."}, {"role": "user", "content": prompt}],
        max_tokens=800,
    )
    return {"task": task, "output": resp.choices[0].message.content, "user_id": user.id}


@router.post("/company-prep")
async def company_prep(
    payload: dict,
    _: None = Depends(require_feature("roadmap_enabled")),
    user: User = Depends(get_current_user),
):
    company = payload.get("company", "")
    role = payload.get("role", "Software Engineer")
    oai = get_openrouter_client()
    prompt = f"Create a company-specific interview prep pack for company={company}, role={role}. Include likely themes, 10 questions, and prep checklist."
    resp = await oai.chat.completions.create(model=OR_DEFAULT_MODEL, messages=[{"role": "user", "content": prompt}], max_tokens=1000)
    return {"company": company, "role": role, "prep": resp.choices[0].message.content, "requested_by": user.id}


@router.post("/portfolio/ingest")
async def ingest_portfolio_artifact(
    payload: dict,
    _: None = Depends(require_feature("portfolio_eval_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    artifact_text = payload.get("artifact_text", "").strip()
    artifact_id = str(uuid.uuid4())
    if not artifact_text:
        return {"status": "ignored", "reason": "artifact_text is required"}
    db.add(
        DocumentEmbedding(
            id=str(uuid.uuid4()),
            user_id=user.id,
            doc_type="portfolio",
            doc_id=artifact_id,
            chunk_index=0,
            content=artifact_text[:4000],
            embedding=[0.0] * 1536,
            metadata_json={"source": payload.get("source", "manual"), "kind": "portfolio_artifact"},
        )
    )
    await db.commit()
    return {"status": "stored", "artifact_id": artifact_id}


@router.post("/portfolio/evaluate")
async def evaluate_portfolio(
    payload: dict,
    _: None = Depends(require_feature("portfolio_eval_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_role = payload.get("target_role", "Software Engineer")
    result = await db.execute(
        select(DocumentEmbedding).where(
            DocumentEmbedding.user_id == user.id,
            DocumentEmbedding.doc_type == "portfolio",
        )
    )
    artifacts = result.scalars().all()
    artifact_text = "\n".join(a.content for a in artifacts[:8])
    oai = get_openrouter_client()
    prompt = (
        f"Evaluate this portfolio for target role {target_role}. "
        "Return strengths, weaknesses, improvements, and relevance score out of 100.\n"
        f"{artifact_text[:10000]}"
    )
    resp = await oai.chat.completions.create(model=OR_DEFAULT_MODEL, messages=[{"role": "user", "content": prompt}], max_tokens=1000)
    return {"target_role": target_role, "evaluation": resp.choices[0].message.content, "artifacts_used": len(artifacts)}
