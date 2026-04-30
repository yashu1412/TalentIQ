"""Mock interview engine: start, answer, score, report."""
import uuid
import json
import re
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.db import get_db
from src.core.auth import get_current_user, require_candidate
from src.core.feature_flags import require_feature
from src.core.openrouter_client import llm_create
from src.data.interview_data import get_static_questions, static_score_answer, get_static_coaching_tips, get_role_round_types, ROLES
from src.models.interview import Interview, InterviewQuestion
from src.models.resume import Resume
from src.models.job import Job
from src.models.user import User

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("/options")
async def interview_options():
    """Return available roles and their round types for frontend dropdowns."""
    return {
        "roles": ROLES,
        "round_types_by_role": {role: get_role_round_types(role) for role in ROLES},
    }


@router.get("/")
async def list_interviews(
    _: None = Depends(require_feature("interview_replay_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch all past interviews for the user."""
    result = await db.execute(
        select(Interview)
        .where(Interview.user_id == user.id)
        .order_by(Interview.created_at.desc())
    )
    interviews = result.scalars().all()
    
    return {
        "interviews": [
            {
                "id": i.id,
                "type": i.type,
                "persona": i.persona,
                "status": i.status,
                "overall_score": i.overall_score,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in interviews
        ]
    }


SCORING_PROMPT = """You are an expert technical interviewer. Evaluate this answer strictly.
Question: {question}
Answer: {answer}

Return JSON with:
- dimension_scores: {{ technical_accuracy: 0-10, relevance: 0-10, clarity: 0-10, completeness: 0-10, conciseness: 0-10, confidence: 0-10 }}
- feedback: string (specific constructive feedback, 2-3 sentences)
- score: int 0-100 (weighted composite)

Weights: technical_accuracy=30%, relevance=20%, clarity=20%, completeness=15%, conciseness=10%, confidence=5%"""


def _extract_json(text: str) -> dict:
    """Robustly extract JSON from LLM response."""
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        text = m.group(1)
    obj = re.search(r"\{.*\}", text, re.DOTALL)
    if obj:
        text = obj.group(0)
    return json.loads(text)


@router.post("/start", status_code=201)
async def start_interview(
    payload: dict,
    _: None = Depends(require_feature("interview_replay_enabled")),
    user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    try:
        interview_type = payload.get("type", "technical")
        mode = payload.get("mode", "text")
        difficulty = payload.get("difficulty", "medium")
        persona = payload.get("persona", "balanced")
        resume_id = payload.get("resume_id")
        job_id = payload.get("job_id")
        role = payload.get("role")          # e.g. "Software Engineer"
        round_type = payload.get("round_type")  # e.g. "Coding & DS/Algo"

        context = f"Interview type: {interview_type}, Difficulty: {difficulty}"
        if resume_id:
            r = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
            resume = r.scalar_one_or_none()
            if resume and resume.parsed_json:
                skills = resume.parsed_json.get("skills", [])
                context += f", Candidate skills: {skills[:15]}"
        if job_id:
            j = await db.execute(select(Job).where(Job.id == job_id))
            job = j.scalar_one_or_none()
            if job:
                context += f", Role: {job.title}"

        # Try LLM first
        questions_data = None
        try:
            prompt = f"""Generate 8 {difficulty} {interview_type} interview questions. Context: {context}
Return JSON: {{ "questions": [ {{ "text": string, "category": string }} ] }}"""
            resp = await llm_create(
                messages=[
                    {"role": "system", "content": "Return only valid JSON. Do not include markdown formatting."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1000,
            )
            questions_data = _extract_json(resp.choices[0].message.content).get("questions", [])
        except Exception as exc:
            print(f"LLM question generation failed ({exc}), using static fallback")

        # Static fallback — role-specific questions
        if not questions_data:
            static = get_static_questions(role or interview_type, round_type, count=8)
            questions_data = [{"text": q["text"], "category": q["category"]} for q in static]

        interview_id = str(uuid.uuid4())
        interview = Interview(
            id=interview_id,
            user_id=user.id,
            type=interview_type,
            mode=mode,
            persona=persona,
            status="active",
            resume_id=resume_id,
            job_id=job_id,
        )
        db.add(interview)

        question_objs = []
        for i, q in enumerate(questions_data):
            q_obj = InterviewQuestion(
                id=str(uuid.uuid4()),
                interview_id=interview_id,
                sequence=i + 1,
                question_text=q.get("text", ""),
            )
            db.add(q_obj)
            question_objs.append(q_obj)

        await db.commit()

        first_q = question_objs[0] if question_objs else None
        return {
            "interview_id": interview_id,
            "first_question": {
                "id": first_q.id,
                "text": first_q.question_text,
                "sequence": 1,
            } if first_q else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{interview_id}/answer")
async def submit_answer(
    interview_id: str,
    payload: dict,
    _: None = Depends(require_feature("interview_replay_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    question_id = payload.get("question_id")
    answer_text = payload.get("answer_text", "")

    r = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.user_id == user.id)
    )
    interview = r.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    q_result = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.id == question_id,
            InterviewQuestion.interview_id == interview_id,
        )
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Try LLM scoring first
    score_data = None
    try:
        score_resp = await llm_create(
            messages=[
                {"role": "system", "content": "Return only valid JSON. Do not include markdown formatting."},
                {"role": "user", "content": SCORING_PROMPT.format(
                    question=question.question_text, answer=answer_text
                )},
            ],
            max_tokens=500,
        )
        score_data = _extract_json(score_resp.choices[0].message.content)
    except Exception as exc:
        print(f"LLM scoring failed ({exc}), using heuristic scoring")

    # Static heuristic fallback
    if not score_data:
        score_data = static_score_answer(answer_text)

    question.answer_text = answer_text
    question.score = score_data.get("score", 0)
    question.feedback = score_data.get("feedback", "")
    question.dimension_scores = score_data.get("dimension_scores", {})

    # Find next question
    next_q_result = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.interview_id == interview_id,
            InterviewQuestion.sequence == question.sequence + 1,
        )
    )
    next_q = next_q_result.scalar_one_or_none()
    finished = next_q is None

    await db.commit()

    return {
        "score": question.score,
        "feedback": question.feedback,
        "next_question": {
            "id": next_q.id,
            "text": next_q.question_text,
            "sequence": next_q.sequence,
        } if next_q else None,
        "finished": finished,
    }


@router.post("/{interview_id}/finish")
async def finish_interview(
    interview_id: str,
    _: None = Depends(require_feature("interview_replay_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.user_id == user.id)
    )
    interview = r.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    q_result = await db.execute(
        select(InterviewQuestion).where(InterviewQuestion.interview_id == interview_id)
    )
    questions = q_result.scalars().all()

    scores = [q.score for q in questions if q.score is not None]
    overall = int(sum(scores) / len(scores)) if scores else 0
    replay_items = []
    previous_score = 0
    for q in sorted(questions, key=lambda item: item.sequence):
        q_score = q.score or 0
        replay_items.append({
            "sequence": q.sequence,
            "question": q.question_text,
            "answer": q.answer_text,
            "score": q_score,
            "delta": q_score - previous_score,
            "feedback": q.feedback,
            "dimension_scores": q.dimension_scores or {},
        })
        previous_score = q_score

    interview.overall_score = overall
    interview.status = "done"
    interview.replay_json = {"timeline": replay_items, "finished_at": datetime.utcnow().isoformat()}
    await db.commit()

    return {"overall_score": overall, "status": "done"}


@router.get("/{interview_id}/report")
async def interview_report(
    interview_id: str,
    _: None = Depends(require_feature("interview_replay_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.user_id == user.id)
    )
    interview = r.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    q_result = await db.execute(
        select(InterviewQuestion)
        .where(InterviewQuestion.interview_id == interview_id)
        .order_by(InterviewQuestion.sequence)
    )
    questions = q_result.scalars().all()

    # Try LLM coaching tips first
    coaching_tips = None
    try:
        feedbacks = [q.feedback for q in questions if q.feedback]
        if feedbacks:
            tips_prompt = f"Based on these interview feedback points, give 3 specific and actionable coaching tips:\n{chr(10).join(feedbacks[:5])}"
            tips_resp = await llm_create(
                messages=[{"role": "user", "content": tips_prompt}],
                max_tokens=500,
            )
            coaching_tips = [
                line.strip()
                for line in tips_resp.choices[0].message.content.split("\n")
                if line.strip()
            ][:5]
    except Exception as exc:
        print(f"LLM coaching tips failed ({exc}), using static tips")

    # Static fallback
    if not coaching_tips:
        coaching_tips = get_static_coaching_tips(5)

    return {
        "overall_score": interview.overall_score,
        "persona": interview.persona,
        "questions": [
            {
                "text": q.question_text,
                "answer": q.answer_text,
                "score": q.score,
                "feedback": q.feedback,
                "dimension_scores": q.dimension_scores,
            }
            for q in questions
        ],
        "coaching_tips": coaching_tips,
    }


@router.get("/{interview_id}/replay")
async def interview_replay(
    interview_id: str,
    _: None = Depends(require_feature("interview_replay_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.user_id == user.id)
    )
    interview = r.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    replay = interview.replay_json or {"timeline": []}
    return {
        "interview_id": interview.id,
        "persona": interview.persona or "balanced",
        "overall_score": interview.overall_score,
        "timeline": replay.get("timeline", []),
        "finished_at": replay.get("finished_at"),
    }
