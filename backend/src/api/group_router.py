import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
import os
import shutil
from pathlib import Path

from src.core.db import get_db
from src.core.auth import get_current_user
from src.models.user import User
from src.models.group_chat import Group, GroupMessage, group_members, GroupFile

router = APIRouter(prefix="/groups", tags=["groups"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_group(
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        name = payload.get("name")
        description = payload.get("description", "")
        member_emails = payload.get("member_emails", [])

        if not name:
            raise HTTPException(status_code=400, detail="Group name is required")

        # Find members by email
        stmt = select(User).where(User.email.in_(member_emails))
        result = await db.execute(stmt)
        members = list(result.scalars().all())
        
        # Ensure creator is a member
        user_in_members = False
        for m in members:
            if m.id == user.id:
                user_in_members = True
                break
        
        if not user_in_members:
            members.append(user)

        # Prepare response data BEFORE commit to avoid "MissingGreenlet" errors 
        # caused by accessing attributes on expired objects after commit.
        user_id = user.id
        response_members = [{"id": m.id, "email": m.email, "full_name": m.full_name} for m in members]

        group_id = str(uuid.uuid4())
        group = Group(
            id=group_id,
            name=name,
            description=description,
            creator_id=user_id,
            members=members
        )
        db.add(group)
        await db.commit()
        
        return {
            "id": group_id,
            "name": name,
            "description": description,
            "creator_id": user_id,
            "creator_clerk_id": user.clerk_user_id,
            "shared_code": "# Start collaborative coding...",
            "shared_language": "python",
            "members": response_members
        }
    except Exception as e:
        import logging
        logging.error(f"Error creating group: {str(e)}", exc_info=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{group_id}/code")
async def update_group_code(
    group_id: str,
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check membership
    member_stmt = select(group_members).where(
        and_(group_members.c.group_id == group_id, group_members.c.user_id == user.id)
    )
    member_check = await db.execute(member_stmt)
    if not member_check.first():
        raise HTTPException(status_code=403, detail="Not a member of this group")

    stmt = select(Group).where(Group.id == group_id)
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if "code" in payload:
        group.shared_code = payload["code"]
    if "language" in payload:
        group.shared_language = payload["language"]
        
    await db.commit()
    return {"status": "code updated"}

@router.get("/")
async def get_groups(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get groups where user is a member
    stmt = select(Group).join(Group.members).where(User.id == user.id).options(
        selectinload(Group.members),
        selectinload(Group.creator)
    )
    result = await db.execute(stmt)
    groups = result.scalars().all()
    
    return [
        {
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "creator_id": g.creator_id,
            "creator_clerk_id": g.creator.clerk_user_id if g.creator else None,
            "shared_code": g.shared_code,
            "shared_language": g.shared_language,
            "members": [{"id": m.id, "email": m.email, "full_name": m.full_name} for m in g.members]
        } for g in groups
    ]

@router.get("/{group_id}/messages")
async def get_messages(
    group_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if user is member
    member_stmt = select(group_members).where(
        and_(group_members.c.group_id == group_id, group_members.c.user_id == user.id)
    )
    member_check = await db.execute(member_stmt)
    if not member_check.first():
        raise HTTPException(status_code=403, detail="Not a member of this group")

    # Get messages
    stmt = select(GroupMessage).where(GroupMessage.group_id == group_id).order_by(GroupMessage.created_at.asc()).options(selectinload(GroupMessage.sender))
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    return [
        {
            "id": m.id,
            "content": m.content,
            "sender_id": m.sender_id,
            "sender_name": m.sender.full_name,
            "sender_email": m.sender.email,
            "created_at": m.created_at.isoformat()
        } for m in messages
    ]

@router.post("/{group_id}/members", status_code=status.HTTP_200_OK)
async def add_members(
    group_id: str,
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Group).where(Group.id == group_id).options(selectinload(Group.members))
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the creator can add members")

    member_emails = payload.get("member_emails", [])
    if not member_emails:
        raise HTTPException(status_code=400, detail="Member emails required")

    stmt = select(User).where(User.email.in_(member_emails))
    res = await db.execute(stmt)
    new_users = res.scalars().all()
    
    existing_ids = {m.id for m in group.members}
    for u in new_users:
        if u.id not in existing_ids:
            group.members.append(u)
    
    await db.commit()
    return {"status": "members added"}

@router.delete("/{group_id}/members/{email}", status_code=status.HTTP_200_OK)
async def remove_member(
    group_id: str,
    email: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Group).where(Group.id == group_id).options(selectinload(Group.members))
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the creator can remove members")
    
    # Find user by email
    stmt = select(User).where(User.email == email)
    res = await db.execute(stmt)
    user_to_remove = res.scalar_one_or_none()
    
    if not user_to_remove:
        raise HTTPException(status_code=404, detail="User not found")
    if user_to_remove.id == group.creator_id:
        raise HTTPException(status_code=400, detail="Cannot remove the creator")

    group.members = [m for m in group.members if m.id != user_to_remove.id]
    await db.commit()
    return {"status": "member removed"}

@router.delete("/{group_id}", status_code=status.HTTP_200_OK)
async def delete_group(
    group_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Group).where(Group.id == group_id)
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the creator can delete the group")

    await db.delete(group)
    await db.commit()
    return {"status": "group deleted"}

@router.post("/{group_id}/messages", status_code=status.HTTP_201_CREATED)
async def send_message(
    group_id: str,
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = payload.get("content")
    if not content:
        raise HTTPException(status_code=400, detail="Message content is required")

    # Check membership
    member_stmt = select(group_members).where(
        and_(group_members.c.group_id == group_id, group_members.c.user_id == user.id)
    )
    member_check = await db.execute(member_stmt)
    if not member_check.first():
        raise HTTPException(status_code=403, detail="Not a member of this group")

    msg_id = str(uuid.uuid4())
    message = GroupMessage(
        id=msg_id,
        group_id=group_id,
        sender_id=user.id,
        content=content
    )
    db.add(message)
    await db.commit()
    
    return {"id": message.id, "status": "sent"}

@router.post("/{group_id}/files", status_code=status.HTTP_201_CREATED)
async def upload_group_file(
    group_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check membership
    member_stmt = select(group_members).where(
        and_(group_members.c.group_id == group_id, group_members.c.user_id == user.id)
    )
    member_check = await db.execute(member_stmt)
    if not member_check.first():
        raise HTTPException(status_code=403, detail="Not a member of this group")

    file_id = str(uuid.uuid4())
    # Robust path for uploads
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    upload_dir = Path(base_dir) / "uploads" / "groups"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_dir / f"{file_id}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/groups/{file_id}_{file.filename}"

    group_file = GroupFile(
        id=file_id,
        group_id=group_id,
        sender_id=user.id,
        file_name=file.filename,
        file_url=file_url,
        file_type=file.content_type
    )
    db.add(group_file)
    await db.commit()
    
    return {"id": file_id, "file_name": file.filename, "status": "uploaded"}

@router.get("/{group_id}/files")
async def get_group_files(
    group_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check membership
    member_stmt = select(group_members).where(
        and_(group_members.c.group_id == group_id, group_members.c.user_id == user.id)
    )
    member_check = await db.execute(member_stmt)
    if not member_check.first():
        raise HTTPException(status_code=403, detail="Not a member of this group")

    stmt = select(GroupFile).where(GroupFile.group_id == group_id).order_by(GroupFile.created_at.desc()).options(selectinload(GroupFile.sender))
    result = await db.execute(stmt)
    files = result.scalars().all()
    
    return [
        {
            "id": f.id,
            "file_name": f.file_name,
            "file_url": f.file_url,
            "file_type": f.file_type,
            "sender_name": f.sender.full_name,
            "created_at": f.created_at.isoformat()
        } for f in files
    ]
