"""Analytics dashboard endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from src.core.db import get_db
from src.core.auth import get_current_user
from src.models.resume import Resume
from src.models.interview import Interview
from src.models.live_room import Application
from src.models.job import JobMatch
from src.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def analytics_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resumes = (await db.execute(select(func.count()).where(Resume.user_id == user.id))).scalar()
    avg_ats = (await db.execute(select(func.avg(Resume.ats_score)).where(Resume.user_id == user.id))).scalar()
    interviews = (await db.execute(select(func.count()).where(Interview.user_id == user.id))).scalar()
    applications = (await db.execute(select(func.count()).where(Application.user_id == user.id))).scalar()

    # Top skill gaps from recent matches
    match_result = await db.execute(
        select(JobMatch).where(JobMatch.user_id == user.id).order_by(JobMatch.created_at.desc()).limit(5)
    )
    matches = match_result.scalars().all()
    skill_gap_map: dict = {}
    for m in matches:
        for sk in (m.missing_skills or []):
            skill_gap_map[sk] = skill_gap_map.get(sk, 0) + 1
    top_gaps = sorted(skill_gap_map, key=lambda k: skill_gap_map[k], reverse=True)[:5]

    return {
        "resumes_uploaded": resumes or 0,
        "avg_ats_score": round(float(avg_ats), 1) if avg_ats else 0.0,
        "mock_interviews_done": interviews or 0,
        "applications_count": applications or 0,
        "skill_gap_top5": top_gaps,
    }


@router.get("/skills")
async def analytics_skills(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    match_result = await db.execute(
        select(JobMatch).where(JobMatch.user_id == user.id).order_by(JobMatch.created_at.desc()).limit(20)
    )
    matches = match_result.scalars().all()

    missing_map: dict = {}
    for m in matches:
        for sk in (m.missing_skills or []):
            missing_map[sk] = missing_map.get(sk, 0) + 1

    return {
        "missing_skills": [{"skill": k, "frequency": v} for k, v in sorted(missing_map.items(), key=lambda x: -x[1])[:10]],
        "strong_skills": [],
    }


@router.get("/interviews")
async def analytics_interviews(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Interview).where(Interview.user_id == user.id, Interview.status == "done"))
    interviews = result.scalars().all()

    total = len(interviews)
    avg_score = round(sum(i.overall_score or 0 for i in interviews) / max(1, total), 1)
    by_type = {"hr": 0, "technical": 0, "coding": 0, "system_design": 0}
    for i in interviews:
        if i.type in by_type:
            by_type[i.type] += 1

    return {"total": total, "avg_score": avg_score, "by_type": by_type, "trend": []}
