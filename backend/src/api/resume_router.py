"""Resume upload, parse status polling, AI improve, version history."""
import uuid
import io
import os
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from src.core.db import get_db
from src.core.auth import get_current_user, require_candidate
from src.core.feature_flags import require_feature
from src.models.resume import Resume, ResumeVersion
from src.models.user import User
from src.workers.resume_tasks import parse_resume
from src.core.openrouter_client import get_openrouter_client, OR_DEFAULT_MODEL

router = APIRouter(prefix="/resumes", tags=["resume"])

CLOUDINARY_URL = os.getenv("CLOUDINARY_URL", "")


async def upload_to_cloudinary(file_bytes: bytes, filename: str) -> str:
    """Upload PDF to Cloudinary and return public URL."""
    import cloudinary, cloudinary.uploader  # type: ignore
    cloudinary.config()
    resp = cloudinary.uploader.upload(
        io.BytesIO(file_bytes),
        resource_type="raw",
        public_id=f"resumes/{uuid.uuid4()}_{filename}",
    )
    return resp["secure_url"]


@router.post("/upload", status_code=202)
async def upload_resume(
    file: UploadFile = File(...),
    target_role: str = Form(default="fullstack_developer"),
    experience_level: str = Form(default="fresher"),
    _: None = Depends(require_feature("resume_pipeline_enabled")),
    user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    # Validate inputs
    valid_roles = {
        "Software Engineer", "Frontend Developer", "Backend Developer",
        "Data Scientist", "Machine Learning Engineer", "DevOps Engineer",
        "Cloud Architect", "Cybersecurity Analyst", "Product Manager", "UX Designer",
        # legacy keys
        "frontend_developer", "backend_developer", "fullstack_developer",
    }
    valid_levels = {"fresher", "intermediate", "advanced"}
    if target_role not in valid_roles:
        target_role = "Software Engineer"
    if experience_level not in valid_levels:
        experience_level = "fresher"
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 5 MB limit")

    file_bytes = await file.read()
    # Try Cloudinary, fall back to in-memory data URL
    try:
        file_url = await upload_to_cloudinary(file_bytes, file.filename)
    except Exception:
        # In dev without Cloudinary, embed the PDF directly so the worker
        # can parse it without HTTP/S3.
        import base64

        b64 = base64.b64encode(file_bytes).decode("ascii")
        file_url = f"data:application/pdf;base64,{b64}"

    resume_id = str(uuid.uuid4())
    resume = Resume(
        id=resume_id,
        user_id=user.id,
        file_url=file_url,
        file_name=file.filename,
        parse_status="pending",
        target_role=target_role,
        experience_level=experience_level,
    )
    db.add(resume)
    await db.commit()

    # Enqueue Celery task
    try:
        parse_resume.delay(resume_id, target_role, experience_level)
    except Exception:
        # Dev fallback: run the parser in a native FastAPI background task
        from src.workers.resume_tasks import _parse_resume_async
        import asyncio
        asyncio.create_task(_parse_resume_async(resume_id, target_role, experience_level))

    return {"resume_id": resume_id, "status": "pending"}


@router.get("")
async def list_resumes(
    _: None = Depends(require_feature("resume_pipeline_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    return [
        {
            "id": r.id,
            "file_name": r.file_name,
            "ats_score": r.ats_score,
            "quality_score": r.quality_score,
            "parse_status": r.parse_status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in resumes
    ]


@router.get("/{resume_id}")
async def get_resume(
    resume_id: str,
    _: None = Depends(require_feature("resume_pipeline_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {
        "id": resume.id,
        "file_name": resume.file_name,
        "raw_text": resume.raw_text,
        "parsed_json": resume.parsed_json,
        "ats_score": resume.ats_score,
        "quality_score": resume.quality_score,
        "current_version": resume.current_version,
        "parse_status": resume.parse_status,
    }


@router.post("/{resume_id}/improve")
async def improve_resume(
    resume_id: str,
    payload: dict,
    _: None = Depends(require_feature("resume_pipeline_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """AI rewrite of a specific resume section against a target JD."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    section = payload.get("section", "experience")
    section_text = ""
    if resume.parsed_json:
        section_text = json.dumps(resume.parsed_json.get(section, ""))

    oai = get_openrouter_client()
    prompt = f"Improve this resume {section} section with stronger, quantified bullet points:\n{section_text}"
    resp = await oai.chat.completions.create(
        model=OR_DEFAULT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
    )
    improved = resp.choices[0].message.content

    # Save version snapshot
    new_version = ResumeVersion(
        id=str(uuid.uuid4()),
        resume_id=resume_id,
        version_number=(resume.current_version or 1) + 1,
        content_json=resume.parsed_json or {},
        diff_summary=f"AI improved {section} section",
    )
    db.add(new_version)
    resume.current_version = new_version.version_number
    await db.commit()

    return {"original": section_text, "improved": improved, "version_id": new_version.id}


@router.get("/{resume_id}/versions")
async def resume_versions(
    resume_id: str,
    _: None = Depends(require_feature("resume_pipeline_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResumeVersion)
        .where(ResumeVersion.resume_id == resume_id)
        .order_by(ResumeVersion.version_number.desc())
    )
    versions = result.scalars().all()
    return [
        {
            "id": v.id,
            "version_number": v.version_number,
            "diff_summary": v.diff_summary,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in versions
    ]
