"""Analytics dashboard endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from src.core.db import get_db
from src.core.auth import get_current_user
from src.models.resume import Resume
from src.models.interview import Interview
from src.models.live_room import Application
from src.models.job import JobMatch
from src.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _safe_days(days: int) -> int:
    return max(7, min(days, 365))


def _delta_block(current: float, previous: float) -> dict:
    delta = current - previous
    pct = 100.0 if previous == 0 and current > 0 else (0.0 if previous == 0 else (delta / previous) * 100.0)
    return {"current": current, "previous": previous, "delta": round(delta, 2), "delta_pct": round(pct, 2)}


@router.get("/dashboard")
async def analytics_dashboard(
    days: int = 30,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    days = _safe_days(days)
    now = datetime.utcnow()
    current_start = now - timedelta(days=days)
    previous_start = current_start - timedelta(days=days)

    resumes = (
        await db.execute(
            select(func.count()).where(Resume.user_id == user.id, Resume.created_at >= current_start)
        )
    ).scalar() or 0
    resumes_prev = (
        await db.execute(
            select(func.count()).where(
                Resume.user_id == user.id,
                Resume.created_at >= previous_start,
                Resume.created_at < current_start,
            )
        )
    ).scalar() or 0

    avg_ats = (
        await db.execute(select(func.avg(Resume.ats_score)).where(Resume.user_id == user.id, Resume.created_at >= current_start))
    ).scalar()
    avg_ats_prev = (
        await db.execute(
            select(func.avg(Resume.ats_score)).where(
                Resume.user_id == user.id,
                Resume.created_at >= previous_start,
                Resume.created_at < current_start,
            )
        )
    ).scalar()

    interviews = (
        await db.execute(
            select(func.count()).where(
                Interview.user_id == user.id,
                Interview.status == "done",
                Interview.created_at >= current_start,
            )
        )
    ).scalar() or 0
    interviews_prev = (
        await db.execute(
            select(func.count()).where(
                Interview.user_id == user.id,
                Interview.status == "done",
                Interview.created_at >= previous_start,
                Interview.created_at < current_start,
            )
        )
    ).scalar() or 0

    applications = (
        await db.execute(
            select(func.count()).where(Application.user_id == user.id, Application.updated_at >= current_start)
        )
    ).scalar() or 0
    applications_prev = (
        await db.execute(
            select(func.count()).where(
                Application.user_id == user.id,
                Application.updated_at >= previous_start,
                Application.updated_at < current_start,
            )
        )
    ).scalar() or 0

    # Top skill gaps from recent matches
    match_result = await db.execute(
        select(JobMatch)
        .where(JobMatch.user_id == user.id, JobMatch.created_at >= current_start)
        .order_by(JobMatch.created_at.desc())
        .limit(20)
    )
    matches = match_result.scalars().all()
    skill_gap_map: dict = {}
    for m in matches:
        for sk in (m.missing_skills or []):
            skill_gap_map[sk] = skill_gap_map.get(sk, 0) + 1
    top_gaps = sorted(skill_gap_map, key=lambda k: skill_gap_map[k], reverse=True)[:5]

    # ATS Trend calculation
    step_days = max(1, days // 6)
    ats_trend = []
    
    r_res = await db.execute(select(Resume).where(Resume.user_id == user.id, Resume.created_at >= current_start))
    all_resumes = r_res.scalars().all()
    
    for idx in range(6):
        bucket_start = current_start + timedelta(days=idx * step_days)
        bucket_end = now if idx == 5 else bucket_start + timedelta(days=step_days)
        bucket_resumes = [r for r in all_resumes if r.created_at and r.created_at >= bucket_start and r.created_at < bucket_end]
        avg = sum(r.ats_score or 0 for r in bucket_resumes) / max(1, len(bucket_resumes)) if bucket_resumes else 0
        ats_trend.append({
            "label": bucket_start.strftime("%b %d"),
            "ats": round(avg, 1)
        })

    return {
        "days": days,
        "resumes_uploaded": resumes,
        "avg_ats_score": round(float(avg_ats), 1) if avg_ats else 0.0,
        "mock_interviews_done": interviews,
        "applications_count": applications,
        "skill_gap_top5": top_gaps,
        "ats_trend": ats_trend,
        "trends": {
            "resumes_uploaded": _delta_block(float(resumes), float(resumes_prev)),
            "avg_ats_score": _delta_block(float(avg_ats or 0), float(avg_ats_prev or 0)),
            "mock_interviews_done": _delta_block(float(interviews), float(interviews_prev)),
            "applications_count": _delta_block(float(applications), float(applications_prev)),
        },
    }


@router.get("/skills")
async def analytics_skills(
    days: int = 30,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    days = _safe_days(days)
    current_start = datetime.utcnow() - timedelta(days=days)
    match_result = await db.execute(
        select(JobMatch)
        .where(JobMatch.user_id == user.id, JobMatch.created_at >= current_start)
        .order_by(JobMatch.created_at.desc())
        .limit(40)
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
    days: int = 30,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    days = _safe_days(days)
    now = datetime.utcnow()
    current_start = now - timedelta(days=days)
    previous_start = current_start - timedelta(days=days)

    result = await db.execute(
        select(Interview).where(
            Interview.user_id == user.id,
            Interview.status == "done",
            Interview.created_at >= current_start,
        )
    )
    interviews = result.scalars().all()
    previous_result = await db.execute(
        select(Interview).where(
            Interview.user_id == user.id,
            Interview.status == "done",
            Interview.created_at >= previous_start,
            Interview.created_at < current_start,
        )
    )
    previous_interviews = previous_result.scalars().all()

    total = len(interviews)
    avg_score = round(sum(i.overall_score or 0 for i in interviews) / max(1, total), 1)
    by_type = {"hr": 0, "technical": 0, "coding": 0, "system_design": 0}
    for i in interviews:
        if i.type in by_type:
            by_type[i.type] += 1

    step_days = max(1, days // 6)
    trend = []
    for idx in range(6):
        bucket_start = current_start + timedelta(days=idx * step_days)
        bucket_end = now if idx == 5 else bucket_start + timedelta(days=step_days)
        bucket_interviews = [
            i for i in interviews
            if i.created_at and i.created_at >= bucket_start and i.created_at < bucket_end
        ]
        count = len(bucket_interviews)
        b_avg = sum(i.overall_score or 0 for i in bucket_interviews) / max(1, count) if count > 0 else 0
        trend.append(
            {
                "label": bucket_start.strftime("%b %d"),
                "count": count,
                "score": round(b_avg, 1),
            }
        )

    return {
        "days": days,
        "total": total,
        "avg_score": avg_score,
        "by_type": by_type,
        "trend": trend,
        "trends": {
            "total": _delta_block(float(total), float(len(previous_interviews))),
            "avg_score": _delta_block(
                float(avg_score),
                float(
                    round(
                        sum(i.overall_score or 0 for i in previous_interviews) / max(1, len(previous_interviews)),
                        1,
                    )
                ),
            ),
        },
    }
