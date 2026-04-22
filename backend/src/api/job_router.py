"""Job analysis, matching and recommendations."""
import uuid
import os
import json
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.db import get_db
from src.core.auth import get_current_user
from src.core.openrouter_client import get_openrouter_client, OR_DEFAULT_MODEL
from src.models.job import Job, JobMatch
from src.models.resume import Resume, ResumeVersion
from src.models.user import User

router = APIRouter(prefix="/jobs", tags=["jobs"])


async def _parse_jd_with_llm(jd_text: str) -> dict:
    oai = get_openrouter_client()
    prompt = f"""Parse this job description and return JSON with:
title (string), company (string), must_have (list of skills), nice_to_have (list of skills),
years_required (int), tools (list), location (string).
JD: {jd_text[:6000]}"""
    resp = await oai.chat.completions.create(
        model=OR_DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": "Return only valid JSON. Do not include markdown formatting."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1000,
    )
    content = resp.choices[0].message.content
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, re.DOTALL)
    if m:
        content = m.group(1)
    obj = re.search(r"\{.*\}", content, re.DOTALL)
    if obj:
        content = obj.group(0)
    return json.loads(content)


@router.post("/analyze", status_code=202)
async def analyze_job(
    payload: dict,
    user: User = Depends(get_current_user),  # any authenticated user can analyze jobs
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
    company_prep = [
        f"Review {job.company or 'company'} engineering values",
        f"Prepare 2 STAR stories aligned with {job.title or 'the role'}",
        "Rehearse role-specific architecture trade-off discussion",
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

    return {"match_id": match.id, "status": "done", "company_prep": company_prep}


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


@match_router.post("/ats-simulate")
async def ats_simulate(
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume_id = payload.get("resume_id")
    job_id = payload.get("job_id")
    compare_latest_versions = bool(payload.get("compare_latest_versions", True))
    if not resume_id or not job_id:
        raise HTTPException(status_code=400, detail="resume_id and job_id required")

    r_result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
    resume = r_result.scalar_one_or_none()
    j_result = await db.execute(select(Job).where(Job.id == job_id))
    job = j_result.scalar_one_or_none()
    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or Job not found")

    job_skills = set(s.lower() for s in ((job.parsed_json or {}).get("must_have", []) + (job.parsed_json or {}).get("nice_to_have", [])))
    versions = [{"version": resume.current_version or 1, "skills": (resume.parsed_json or {}).get("skills", [])}]
    if compare_latest_versions:
        v_result = await db.execute(
            select(ResumeVersion)
            .where(ResumeVersion.resume_id == resume.id)
            .order_by(ResumeVersion.version_number.desc())
            .limit(2)
        )
        for v in v_result.scalars().all():
            versions.append({"version": v.version_number, "skills": (v.content_json or {}).get("skills", [])})

    seen_versions = {}
    comparison = []
    for version in versions:
        version_number = version["version"]
        if version_number in seen_versions:
            continue
        seen_versions[version_number] = True
        skill_set = set(s.lower() for s in version["skills"])
        overlap = len(skill_set.intersection(job_skills))
        score = int(min(100, (overlap / max(1, len(job_skills))) * 100))
        comparison.append({"version": version_number, "ats_score": score, "matched_keywords": overlap})

    comparison.sort(key=lambda x: x["version"])
    best = max(comparison, key=lambda x: x["ats_score"]) if comparison else None
    return {"job_id": job.id, "resume_id": resume.id, "comparison": comparison, "best_version": best}
