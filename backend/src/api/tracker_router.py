"""Application tracker CRUD."""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.db import get_db
from src.core.auth import get_current_user
from src.models.live_room import Application
from src.models.job import Job
from src.models.user import User

router = APIRouter(prefix="/applications", tags=["tracker"])

STATUS_ORDER = ["saved", "applied", "screening", "interview", "offer", "rejected"]


@router.post("", status_code=201)
async def create_application(
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    app = Application(
        id=str(uuid.uuid4()),
        user_id=user.id,
        job_id=payload.get("job_id"),
        title=payload.get("title"),
        company=payload.get("company"),
        status=payload.get("status", "saved"),
        notes=payload.get("notes"),
        next_step=payload.get("next_step"),
        reminder_at=datetime.fromisoformat(payload["reminder_at"]) if payload.get("reminder_at") else None,
    )
    db.add(app)
    await db.commit()
    return {"id": app.id, "status": app.status}


@router.patch("/{app_id}")
async def update_application(
    app_id: str,
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.id == app_id, Application.user_id == user.id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if "status" in payload:
        app.status = payload["status"]
        if payload["status"] == "applied":
            app.applied_at = datetime.utcnow()
    if "notes" in payload:
        app.notes = payload["notes"]
    if "next_step" in payload:
        app.next_step = payload["next_step"]
    if "reminder_at" in payload:
        app.reminder_at = datetime.fromisoformat(payload["reminder_at"]) if payload["reminder_at"] else None
    app.last_activity_at = datetime.utcnow()

    await db.commit()
    return {
        "id": app.id,
        "status": app.status,
        "notes": app.notes,
        "next_step": app.next_step,
        "reminder_at": app.reminder_at.isoformat() if app.reminder_at else None,
    }


@router.get("")
async def list_applications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.user_id == user.id).order_by(Application.updated_at.desc())
    )
    apps = result.scalars().all()
    return [
        {
            "id": a.id,
            "job_id": a.job_id,
            "title": a.title,
            "company": a.company,
            "status": a.status,
            "notes": a.notes,
            "next_step": a.next_step,
            "reminder_at": a.reminder_at.isoformat() if a.reminder_at else None,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
        }
        for a in apps
    ]


@router.get("/timeline")
async def application_timeline(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.user_id == user.id)
    )
    apps = result.scalars().all()
    timeline = {s: [] for s in STATUS_ORDER}
    for a in apps:
        if a.status in timeline:
            timeline[a.status].append({
                "id": a.id,
                "job_id": a.job_id,
                "title": a.title,
                "company": a.company,
                "updated_at": a.updated_at.isoformat() if a.updated_at else None,
            })
    return timeline


@router.get("/analytics")
async def tracker_analytics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Application).where(Application.user_id == user.id))
    apps = result.scalars().all()
    by_status = {status: 0 for status in STATUS_ORDER}
    due_reminders = 0
    for app in apps:
        by_status[app.status] = by_status.get(app.status, 0) + 1
        if app.reminder_at and app.reminder_at <= datetime.utcnow() and app.status not in ("offer", "rejected"):
            due_reminders += 1
    return {
        "total": len(apps),
        "by_status": by_status,
        "due_reminders": due_reminders,
        "active_pipeline": len([a for a in apps if a.status not in ("offer", "rejected")]),
    }
