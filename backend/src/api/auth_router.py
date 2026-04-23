"""Clerk webhook handler + user profile sync."""
import uuid
import os
from fastapi import APIRouter, Request, HTTPException, Depends
from svix.webhooks import Webhook, WebhookVerificationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.db import get_db
from src.core.auth import get_current_user
from src.models.user import User, UserProfile

router = APIRouter(prefix="/auth", tags=["auth"])

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET", "")


@router.post("/webhook")
async def clerk_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Sync Clerk user events into PostgreSQL."""
    payload = await request.body()
    headers = dict(request.headers)
    try:
        wh = Webhook(CLERK_WEBHOOK_SECRET)
        event = wh.verify(payload, headers)
    except WebhookVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event.get("type")
    data = event.get("data", {})

    if event_type in ("user.created", "user.updated"):
        clerk_id = data["id"]
        email = data["email_addresses"][0]["email_address"] if data.get("email_addresses") else ""
        full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        avatar = data.get("image_url")
        
        # Get role from Clerk public_metadata if present, otherwise default to candidate
        metadata = data.get("public_metadata", {})
        role = metadata.get("role", "candidate")
        if role not in ("candidate", "recruiter", "admin"):
            role = "candidate"

        result = await db.execute(select(User).where(User.clerk_user_id == clerk_id))
        user = result.scalar_one_or_none()

        if user:
            user.email = email
            user.full_name = full_name
            user.avatar_url = avatar
            user.role = role
        else:
            user = User(
                id=str(uuid.uuid4()),
                clerk_user_id=clerk_id,
                email=email,
                full_name=full_name,
                avatar_url=avatar,
                role=role,
            )
            db.add(user)
            await db.flush()
            profile = UserProfile(user_id=user.id)
            db.add(profile)

        await db.commit()

    return {"ok": True}


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    """Return authenticated user + profile."""
    profile = user.profile
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "profile": {
            "target_roles": profile.target_roles if profile else [],
            "experience_level": profile.experience_level if profile else None,
            "preferred_locations": profile.preferred_locations if profile else [],
            "skills_summary": profile.skills_summary if profile else None,
            "bio": profile.bio if profile else None,
        } if profile else {},
    }


@router.patch("/me/profile")
async def update_profile(
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user profile fields."""
    if not user.profile:
        user.profile = UserProfile(user_id=user.id)
        db.add(user.profile)

    allowed = ("target_roles", "experience_level", "preferred_locations", "bio", "goals_json")
    for key in allowed:
        if key in payload:
            setattr(user.profile, key, payload[key])
    await db.commit()
    return {"ok": True}


@router.patch("/sync")
async def sync_clerk_user(
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sync frontend clerk user data to backend when webhook fails locally."""
    email = payload.get("email")
    full_name = payload.get("full_name")
    
    if email and "@placeholder.com" in user.email:
        user.email = email
    if full_name and user.full_name == "TalentIQ User":
        user.full_name = full_name
        
    await db.commit()
    return {"ok": True}

