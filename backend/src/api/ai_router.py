"""AI Copilot: chat, cover letter, roadmap, question generation."""
import uuid
import os
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import openai

from src.core.db import get_db, AsyncSessionLocal
from src.core.auth import get_current_user
from src.models.live_room import Chat, ChatMessage
from src.models.resume import Resume
from src.models.job import Job
from src.models.user import User

router = APIRouter(prefix="/copilot", tags=["copilot"])
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


async def _detect_intent(message: str) -> str:
    """Fast LLM classifier to route to the right chain."""
    oai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY, base_url="https://api.ai.cc/v1")
    resp = await oai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Classify the user intent as one of: resume_improve, cover_letter, interview_prep, roadmap, general. Return only the label.",
            },
            {"role": "user", "content": message},
        ],
        max_tokens=10,
    )
    return resp.choices[0].message.content.strip()


@router.post("/chat")
async def copilot_chat(
    payload: dict,
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
        context_parts.append(f"Skills: {user.profile.skills_summary}")

    system_prompt = (
        "You are TalentIQ Career Copilot — an expert AI career mentor. "
        "Provide specific, actionable career advice. Context: " + " | ".join(context_parts)
    )

    oai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY, base_url="https://api.ai.cc/v1")

    async def stream_response():
        full_response = ""
        try:
            stream = await oai.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else ""
                if delta:
                    full_response += delta
                    # The frontend expects standard JSON object streamed.
                    yield f"data: {json.dumps({'delta': delta})}\n\n"
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

    oai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY, base_url="https://api.ai.cc/v1")
    prompt = f"""Write a {tone} cover letter for this candidate applying to the job.
Candidate resume: {resume_text}
Job description: {jd_text}
Write a compelling 3-paragraph cover letter."""

    resp = await oai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
    )
    cover_letter = resp.choices[0].message.content
    return {"cover_letter": cover_letter, "word_count": len(cover_letter.split())}


@router.post("/roadmap")
async def generate_roadmap(
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_role = payload.get("target_role", "Software Engineer")
    timeline_weeks = payload.get("timeline_weeks", 12)
    resume_id = payload.get("resume_id")

    skills_gap = ""
    if resume_id:
        r = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
        resume = r.scalar_one_or_none()
        if resume and resume.parsed_json:
            skills_gap = f"Current skills: {resume.parsed_json.get('skills', [])}"

    oai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY, base_url="https://api.ai.cc/v1")
    prompt = f"""Create a {timeline_weeks}-week learning roadmap to become a {target_role}.
{skills_gap}
Return JSON with: weeks (list of {{week: int, topics: list, resources: list}})."""

    resp = await oai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content)


@router.post("/questions")
async def generate_interview_questions(
    payload: dict,
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

    oai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY, base_url="https://api.ai.cc/v1")
    prompt = f"""Generate {count} {interview_type} interview questions.
{context}
Return JSON with: questions (list of {{id, text, difficulty, category}})."""

    resp = await oai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    data = json.loads(resp.choices[0].message.content)
    # Ensure UUIDs
    for q in data.get("questions", []):
        if not q.get("id"):
            q["id"] = str(uuid.uuid4())
    return data
