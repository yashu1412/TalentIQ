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
        status=payload.get("status", "saved"),
        notes=payload.get("notes"),
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

    await db.commit()
    return {"id": app.id, "status": app.status, "notes": app.notes}


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
            "status": a.status,
            "notes": a.notes,
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
                "id": a.id, "job_id": a.job_id,
                "updated_at": a.updated_at.isoformat() if a.updated_at else None,
            })
    return timeline
