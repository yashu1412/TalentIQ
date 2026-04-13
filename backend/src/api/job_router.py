"""Job analysis, matching and recommendations."""
import uuid
import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import openai

from src.core.db import get_db
from src.core.auth import get_current_user, require_recruiter
from src.models.job import Job, JobMatch
from src.models.resume import Resume
from src.models.user import User

router = APIRouter(prefix="/jobs", tags=["jobs"])
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


async def _parse_jd_with_llm(jd_text: str) -> dict:
    oai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY, base_url="https://api.ai.cc/v1")
    prompt = f"""Parse this job description and return JSON with:
title (string), company (string), must_have (list of skills), nice_to_have (list of skills),
years_required (int), tools (list), location (string).
JD: {jd_text[:6000]}"""
    resp = await oai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content)


@router.post("/analyze", status_code=202)
async def analyze_job(
    payload: dict,
    user: User = Depends(require_recruiter),
    db: AsyncSession = Depends(get_db),
):
    jd_text = payload.get("jd_text", "")
    url = payload.get("url", "")
    if not jd_text and not url:
        raise HTTPException(status_code=400, detail="Provide jd_text or url")

    # If URL provided, fetch text
    if url and not jd_text:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, follow_redirects=True)
            jd_text = resp.text[:8000]

    job_id = str(uuid.uuid4())
    job = Job(
        id=job_id,
        source="manual" if payload.get("jd_text") else "scraper",
        title="Parsing...",
        jd_text=jd_text,
        url=url,
    )
    db.add(job)
    await db.commit()

    # Parse asynchronously (in a background task for now)
    try:
        parsed = await _parse_jd_with_llm(jd_text)
        job.title = parsed.get("title", "Unknown")
        job.company = parsed.get("company", "")
        job.location = parsed.get("location", "")
        job.parsed_json = parsed
        await db.commit()
    except Exception:
        pass

    return {"job_id": job_id, "status": "pending"}


@router.get("/{job_id}")
async def get_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "jd_text": job.jd_text,
        "parsed_json": job.parsed_json,
    }


# --- Matching ---
match_router = APIRouter(prefix="/matches", tags=["matches"])


def _jaccard_overlap(set_a: set, set_b: set) -> float:
    if not set_a or not set_b:
        return 0.0
    intersection = set_a.intersection(set_b)
    return len(intersection) / len(set_a.union(set_b))


@match_router.post("/create", status_code=202)
async def create_match(
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume_id = payload.get("resume_id")
    job_id = payload.get("job_id")
    if not resume_id or not job_id:
        raise HTTPException(status_code=400, detail="resume_id and job_id required")

    r_result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
    resume = r_result.scalar_one_or_none()
    j_result = await db.execute(select(Job).where(Job.id == job_id))
    job = j_result.scalar_one_or_none()

    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or Job not found")

    # Hybrid scoring
    resume_skills = set(
        s.lower() for s in (resume.parsed_json or {}).get("skills", [])
    ) if resume.parsed_json else set()

    jd_must = set(
        s.lower() for s in (job.parsed_json or {}).get("must_have", [])
    ) if job.parsed_json else set()

    jd_nice = set(
        s.lower() for s in (job.parsed_json or {}).get("nice_to_have", [])
    ) if job.parsed_json else set()

    skills_overlap = _jaccard_overlap(resume_skills, jd_must)
    keyword_density = min(1.0, len(resume_skills.intersection(jd_must | jd_nice)) / max(1, len(jd_must | jd_nice)))
    missing_skills = list(jd_must - resume_skills)

    # Weighted formula from design doc.
    # NOTE: weighted sum is in [0,1], so clamp after multiplying by 100.
    weighted = (
        skills_overlap * 0.40
        + keyword_density * 0.10
        + 0.30  # placeholder for semantic/project/exp
    )
    match_score = int(min(1.0, max(0.0, weighted)) * 100)

    recommendations = [
        {"skill": s, "resource": f"Learn {s} on Coursera/Udemy", "priority": "high"}
        for s in missing_skills[:5]
    ]

    match = JobMatch(
        id=str(uuid.uuid4()),
        user_id=user.id,
        resume_id=resume_id,
        job_id=job_id,
        match_score=match_score,
        ats_score=int(keyword_density * 100),
        missing_skills=missing_skills,
        recommendations=recommendations,
    )
    db.add(match)
    await db.commit()

    return {"match_id": match.id, "status": "done"}


@match_router.get("/{match_id}")
async def get_match(
    match_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobMatch).where(JobMatch.id == match_id, JobMatch.user_id == user.id)
    )
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return {
        "match_score": match.match_score,
        "ats_score": match.ats_score,
        "missing_skills": match.missing_skills,
        "recommendations": match.recommendations,
    }


@match_router.get("/user/{user_id_param}")
async def user_matches(
    user_id_param: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobMatch).where(JobMatch.user_id == user.id).order_by(JobMatch.created_at.desc())
    )
    matches = result.scalars().all()
    return [
        {
            "id": m.id,
            "job_id": m.job_id,
            "resume_id": m.resume_id,
            "match_score": m.match_score,
            "ats_score": m.ats_score,
            "missing_skills": m.missing_skills,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in matches
    ]
