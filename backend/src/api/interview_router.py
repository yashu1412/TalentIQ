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


def _resume_context_blob(resume: Resume) -> str:
    """Build a compact text snapshot used for resume-grounded prompts."""
    parsed = resume.parsed_json or {}
    sections = []

    summary = parsed.get("summary") or parsed.get("professional_summary")
    if summary:
        sections.append(f"Summary: {summary}")

    skills = parsed.get("skills") or []
    if skills:
        if isinstance(skills, dict):
            skill_values = []
            for value in skills.values():
                if isinstance(value, list):
                    skill_values.extend(value)
                elif value:
                    skill_values.append(str(value))
            skills = skill_values
        sections.append(f"Skills: {', '.join(str(skill) for skill in skills[:20])}")

    experience = parsed.get("experience") or parsed.get("work_experience") or []
    if isinstance(experience, list) and experience:
        exp_lines = []
        for item in experience[:4]:
            if isinstance(item, dict):
                title = item.get("title") or item.get("role") or item.get("position") or "Unknown title"
                company = item.get("company") or item.get("organization") or "Unknown company"
                achievements = item.get("achievements") or item.get("highlights") or item.get("responsibilities") or []
                if isinstance(achievements, list):
                    achievement_text = "; ".join(str(point) for point in achievements[:2])
                else:
                    achievement_text = str(achievements)
                exp_lines.append(f"{title} at {company}: {achievement_text}".strip())
            else:
                exp_lines.append(str(item))
        sections.append("Experience: " + " | ".join(exp_lines))

    projects = parsed.get("projects") or []
    if isinstance(projects, list) and projects:
        project_lines = []
        for item in projects[:3]:
            if isinstance(item, dict):
                name = item.get("name") or item.get("title") or "Project"
                details = item.get("description") or item.get("summary") or item.get("impact") or ""
                tech = item.get("technologies") or item.get("tech_stack") or []
                tech_text = f" ({', '.join(str(t) for t in tech[:5])})" if isinstance(tech, list) and tech else ""
                project_lines.append(f"{name}{tech_text}: {details}".strip())
            else:
                project_lines.append(str(item))
        sections.append("Projects: " + " | ".join(project_lines))

    education = parsed.get("education") or []
    if isinstance(education, list) and education:
        edu_lines = []
        for item in education[:2]:
            if isinstance(item, dict):
                degree = item.get("degree") or item.get("qualification") or "Degree"
                institution = item.get("institution") or item.get("school") or "Institution"
                edu_lines.append(f"{degree} at {institution}")
            else:
                edu_lines.append(str(item))
        sections.append("Education: " + " | ".join(edu_lines))

    if not sections and resume.raw_text:
        sections.append(f"Resume text: {resume.raw_text[:2500]}")

    return "\n".join(section for section in sections if section).strip()


def _resume_round_fallback_questions(resume: Resume, role: str | None, count: int = 8) -> list[dict]:
    """Create deterministic resume-only questions when the LLM is unavailable."""
    parsed = resume.parsed_json or {}
    questions: list[dict] = []
    role_label = role or "this role"

    summary = parsed.get("summary") or parsed.get("professional_summary")
    if summary:
        questions.append({
            "text": f"Give me a concise walkthrough of your background based on the summary in your resume and explain how it prepares you for {role_label}.",
            "category": "Resume Summary",
        })

    experience = parsed.get("experience") or parsed.get("work_experience") or []
    if isinstance(experience, list):
        for item in experience[:3]:
            if not isinstance(item, dict):
                continue
            title = item.get("title") or item.get("role") or item.get("position")
            company = item.get("company") or item.get("organization")
            achievements = item.get("achievements") or item.get("highlights") or item.get("responsibilities") or []
            focus = achievements[0] if isinstance(achievements, list) and achievements else None
            if title and company:
                prompt = f"On your resume you list {title} at {company}. What were your main responsibilities and measurable impact there?"
                if focus:
                    prompt = f"On your resume you mention {focus} while working as {title} at {company}. Walk me through the problem, your actions, and the outcome."
                questions.append({"text": prompt, "category": "Experience"})

    projects = parsed.get("projects") or []
    if isinstance(projects, list):
        for item in projects[:2]:
            if not isinstance(item, dict):
                continue
            name = item.get("name") or item.get("title")
            tech = item.get("technologies") or item.get("tech_stack") or []
            if name:
                tech_text = ""
                if isinstance(tech, list) and tech:
                    tech_text = f" and why you chose {', '.join(str(t) for t in tech[:4])}"
                questions.append({
                    "text": f"Tell me about the {name} project on your resume, including the goal, your contribution{tech_text}, and the result.",
                    "category": "Projects",
                })

    skills = parsed.get("skills") or []
    flat_skills: list[str] = []
    if isinstance(skills, dict):
        for value in skills.values():
            if isinstance(value, list):
                flat_skills.extend(str(item) for item in value[:6])
            elif value:
                flat_skills.append(str(value))
    elif isinstance(skills, list):
        flat_skills = [str(item) for item in skills[:8]]
    if flat_skills:
        questions.append({
            "text": f"Your resume highlights skills like {', '.join(flat_skills[:5])}. Which of these are your strongest, and where have you applied them in real work?",
            "category": "Skills",
        })

    education = parsed.get("education") or []
    if isinstance(education, list) and education:
        questions.append({
            "text": "How has your education or training, as listed on your resume, shaped the way you approach your work today?",
            "category": "Education",
        })

    questions.append({
        "text": "Looking at your resume as a whole, which experience best represents your strengths, and what should an interviewer understand about you from it?",
        "category": "Reflection",
    })
    questions.append({
        "text": "If I asked you to expand one bullet point from your resume that is easy to underestimate, which would you choose and why?",
        "category": "Resume Depth",
    })

    deduped: list[dict] = []
    seen: set[str] = set()
    for question in questions:
        text = question["text"]
        if text not in seen:
            deduped.append(question)
            seen.add(text)
        if len(deduped) >= count:
            return deduped

    while len(deduped) < count:
        deduped.append({
            "text": "Choose one accomplishment from your resume and explain the context, your specific contribution, the challenges, and the outcome.",
            "category": "Resume Review",
        })

    return deduped[:count]


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
        is_resume_round = round_type == "Resume round"

        context = f"Interview type: {interview_type}, Difficulty: {difficulty}"
        resume = None
        if resume_id:
            r = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
            resume = r.scalar_one_or_none()
            if resume and resume.parsed_json:
                skills = resume.parsed_json.get("skills", [])
                context += f", Candidate skills: {skills[:15]}"
        if is_resume_round:
            if not resume_id:
                raise HTTPException(status_code=400, detail="Resume round requires a resume_id")
            if not resume:
                raise HTTPException(status_code=404, detail="Resume not found")
            if not (resume.parsed_json or resume.raw_text):
                raise HTTPException(status_code=400, detail="Resume content is not ready yet")
        if job_id and not is_resume_round:
            j = await db.execute(select(Job).where(Job.id == job_id))
            job = j.scalar_one_or_none()
            if job:
                context += f", Role: {job.title}"

        # Try LLM first
        questions_data = None
        try:
            if is_resume_round and resume:
                resume_context = _resume_context_blob(resume)
                prompt = f"""Generate 8 interview questions for a resume review round for the role "{role or interview_type}".
Ask questions only about the candidate's resume. Focus on projects, experience, skills, achievements, education, ownership, impact, and decisions shown in the resume.
Do not ask generic theory questions unless directly anchored to something explicitly mentioned in the resume.
Do not use job description context, company-specific prep, or broad role-fit questions outside the resume.
Resume:
{resume_context}

Return JSON: {{ "questions": [ {{ "text": string, "category": string }} ] }}"""
            else:
                prompt = f"""Generate 8 {difficulty} {interview_type} interview questions for the role "{role or interview_type}" and round "{round_type or 'General'}". Context: {context}
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
            if is_resume_round and resume:
                questions_data = _resume_round_fallback_questions(resume, role=role, count=8)
            else:
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
            "total_questions": len(question_objs),
        }
    except HTTPException:
        raise
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
