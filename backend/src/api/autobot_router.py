"""
autobot_router.py
─────────────────
FastAPI router that controls the job-application bot.

Endpoints:
  POST   /v1/autobot/start           — Start the bot subprocess
  POST   /v1/autobot/stop            — Stop the bot
  GET    /v1/autobot/status          — Bot status + stats
  GET    /v1/autobot/logs            — SSE real-time log stream
  GET    /v1/autobot/applied-jobs    — List of all applied jobs
  POST   /v1/autobot/applied-jobs/{index}/mark  — Toggle Manual/External status
  DELETE /v1/autobot/applied-jobs/{index}       — Delete a job entry
  GET    /v1/autobot/config          — Get current job preferences
  PUT    /v1/autobot/config          — Update job preferences (save to file)
  GET    /v1/autobot/session-state   — Last session state
"""

import asyncio
import json
import logging
import os
import re
import subprocess
import sys
import time
from collections import deque
from datetime import datetime, date
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError

from src.core.auth import get_current_user, CLERK_JWT_PUBLIC_KEY, CLERK_JWT_ISSUER, ALLOW_INSECURE_JWT_DECODE, APP_ENV
from src.core.db import get_db
from src.models.user import User
from src.models.resume import Resume

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/autobot", tags=["autobot"])

# ── Paths ─────────────────────────────────────────────────────────────────────
_AUTOBOT_DIR  = Path(__file__).resolve().parent.parent / "autobot"
_CONFIG_DIR   = _AUTOBOT_DIR / "config"
_DATA_DIR     = _AUTOBOT_DIR / "data"
_PREFS_FILE   = _CONFIG_DIR / "job_prefs.json"
_APPLIED_FILE = _DATA_DIR / "applied_jobs.json"
_STATE_FILE   = _DATA_DIR / "session_state.json"

# ── In-memory bot state ───────────────────────────────────────────────────────
_bot_process:  Optional[subprocess.Popen] = None
_log_buffer:   deque = deque(maxlen=500)   # rolling log of last 500 lines
_start_time:   Optional[float] = None
_session_count: int = 0


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_running() -> bool:
    global _bot_process
    if _bot_process is None:
        return False
    poll = _bot_process.poll()
    if poll is not None:
        _bot_process = None
        return False
    return True


def _load_json(path: Path, default):
    try:
        if path.exists():
            with open(path, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return default


def _save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def _append_log(line: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    _log_buffer.append(f"[{ts}] {line.rstrip()}")


def _stream_subprocess_output(proc: subprocess.Popen) -> None:
    """Read subprocess stdout/stderr in a background thread and push to log buffer."""
    try:
        for line in proc.stdout:
            _append_log(line)
    except Exception:
        pass
    finally:
        _append_log("--- Bot process ended ---")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/start")
async def start_bot(
    payload: dict = {},
    user: User = Depends(get_current_user),
):
    """
    Start the job application bot as a managed subprocess.
    The bot runs the scheduler from src.autobot.core.scheduler.
    """
    global _bot_process, _start_time, _session_count, _log_buffer

    if _is_running():
        raise HTTPException(status_code=409, detail="Bot is already running.")

    # Ensure data dir exists
    _DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Build command — run as a Python module from the backend root
    backend_root = Path(__file__).resolve().parent.parent.parent  # backend/
    cmd = [sys.executable, "-m", "src.autobot.runner"]

    env = {**os.environ, "PYTHONIOENCODING": "utf-8"}

    # ── Inject per-user credentials from the credentials file ──────────────────
    creds_path = _creds_file(user.id)
    creds = _load_json(creds_path, {})
    creds_map = {
        "linkedin_email":    "AUTOBOT_LINKEDIN_EMAIL",
        "linkedin_password": "AUTOBOT_LINKEDIN_PASSWORD",
        "naukri_email":      "AUTOBOT_NAUKRI_EMAIL",
        "naukri_password":   "AUTOBOT_NAUKRI_PASSWORD",
        "yc_email":          "AUTOBOT_YC_EMAIL",
        "yc_password":       "AUTOBOT_YC_PASSWORD",
    }
    for cred_key, env_key in creds_map.items():
        if cred_key in creds:
            env[env_key] = creds[cred_key]   # override .env value with user's saved credentials (even if empty to support SSO)

    # ── Inject per-user profile from the profile file ──────────────────────────
    profile_path = _profile_file(user.id)
    uprofile = _load_json(profile_path, {})
    if uprofile:
        profile_map = {
            "full_name":           "AUTOBOT_FULL_NAME",
            "email":               "AUTOBOT_PERSONAL_EMAIL",
            "phone":               "AUTOBOT_PHONE",
            "city":                "AUTOBOT_CITY",
            "country":             "AUTOBOT_COUNTRY",
            "linkedin_url":        "AUTOBOT_LINKEDIN_URL",
            "portfolio_url":       "AUTOBOT_PORTFOLIO_URL",
            "github_url":          "AUTOBOT_GITHUB_URL",
            "years_of_experience": "AUTOBOT_YEARS_EXP",
            "current_title":       "AUTOBOT_CURRENT_TITLE",
            "education":           "AUTOBOT_EDUCATION",
            "summary":             "AUTOBOT_RESUME_SUMMARY",
        }
        for k, env_key in profile_map.items():
            if k in uprofile:
                env[env_key] = str(uprofile[k])
        if "skills" in uprofile:
            env["AUTOBOT_SKILLS"] = ",".join(uprofile["skills"])

    # Apply any per-request overrides (e.g. platform toggles passed from frontend)
    platforms_override = payload.get("platforms")
    if platforms_override and isinstance(platforms_override, dict):
        # Persist to job_prefs so the subprocess picks it up
        prefs = _load_json(_PREFS_FILE, {})
        existing_platforms = prefs.get("platforms", {})
        for k, v in platforms_override.items():
            existing_platforms[k] = {"enabled": bool(v.get("enabled", False))}
        prefs["platforms"] = existing_platforms
        _save_json(_PREFS_FILE, prefs)

    try:
        _bot_process = subprocess.Popen(
            cmd,
            cwd=str(backend_root),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            encoding="utf-8",
            bufsize=1,
            env=env,
        )
        _start_time    = time.time()
        _session_count = 0
        _log_buffer    = deque(maxlen=500)
        _append_log("🚀 Bot subprocess started (PID: {})".format(_bot_process.pid))
        logger.info(f"[AUTOBOT] Started bot subprocess PID={_bot_process.pid}")
    except Exception as e:
        logger.error(f"[AUTOBOT] Failed to start subprocess: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start bot: {e}")

    # Stream output in a background thread
    import threading
    t = threading.Thread(target=_stream_subprocess_output, args=(_bot_process,), daemon=True)
    t.start()

    return {
        "status": "started",
        "pid": _bot_process.pid,
        "started_at": datetime.utcnow().isoformat(),
    }


@router.post("/stop")
async def stop_bot(user: User = Depends(get_current_user)):
    """Terminate the running bot subprocess."""
    global _bot_process

    if not _is_running():
        raise HTTPException(status_code=409, detail="Bot is not running.")

    try:
        _bot_process.terminate()
        try:
            _bot_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _bot_process.kill()
        _append_log("🛑 Bot stopped by user.")
        logger.info("[AUTOBOT] Bot subprocess terminated by user.")
        _bot_process = None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop bot: {e}")

    return {"status": "stopped"}


@router.get("/status")
async def get_status(user: User = Depends(get_current_user)):
    """Get current bot status + session stats."""
    running = _is_running()
    applied_jobs = _load_json(_APPLIED_FILE, [])
    state = _load_json(_STATE_FILE, {})

    today_str = date.today().isoformat()
    today_count  = len([j for j in applied_jobs if j.get("applied_at", "").startswith(today_str) and j.get("status") == "Submitted"])
    total_count  = len(applied_jobs)
    external_cnt = len([j for j in applied_jobs if j.get("status") == "External - Ready"])

    uptime_secs = int(time.time() - _start_time) if running and _start_time else 0

    return {
        "status":           "running" if running else "idle",
        "pid":              _bot_process.pid if running and _bot_process else None,
        "uptime_seconds":   uptime_secs,
        "today_applied":    today_count,
        "total_applied":    total_count,
        "external_pending": external_cnt,
        "last_run":         state.get("last_run"),
        "last_country":     state.get("last_country"),
        "platforms_run":    state.get("platforms_run", []),
    }


async def get_user_from_token_param_or_header(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    jwt_token = None
    if authorization and authorization.startswith("Bearer "):
        jwt_token = authorization.split(" ", 1)[1]
    elif token:
        jwt_token = token

    if not jwt_token:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    try:
        if CLERK_JWT_PUBLIC_KEY:
            payload = jwt.decode(
                jwt_token,
                CLERK_JWT_PUBLIC_KEY,
                algorithms=["RS256"],
                options={"verify_aud": False},
                issuer=CLERK_JWT_ISSUER or None,
            )
        elif ALLOW_INSECURE_JWT_DECODE or APP_ENV != "production":
            payload = jwt.decode(
                jwt_token,
                "",
                options={"verify_signature": False, "verify_exp": False, "verify_aud": False},
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="JWT verification is not configured.",
            )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()
    if not user:
        import uuid
        from src.models.user import UserProfile
        user = User(
            id=str(uuid.uuid4()),
            clerk_user_id=clerk_user_id,
            email=f"{clerk_user_id}@placeholder.com",
            full_name="TalentIQ User"
        )
        db.add(user)
        await db.flush()
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(user)
    return user


@router.get("/logs")
async def stream_logs(user: User = Depends(get_user_from_token_param_or_header)):
    """
    Server-Sent Events endpoint for real-time bot logs.
    Streams the rolling log buffer, then tails new lines.
    """
    async def _event_generator():
        # 1. Flush existing buffer first
        snapshot = list(_log_buffer)
        for line in snapshot:
            yield f"data: {line}\n\n"

        # 2. Tail new log lines (poll every 0.5s)
        sent_up_to = len(snapshot)
        while True:
            await asyncio.sleep(0.5)
            current = list(_log_buffer)
            new_lines = current[sent_up_to:]
            for line in new_lines:
                yield f"data: {line}\n\n"
            sent_up_to = len(current)

            # Keep-alive ping every 15s
            yield ": ping\n\n"

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/logs/clear")
async def clear_logs(user: User = Depends(get_current_user)):
    """Clear the rolling log buffer."""
    global _log_buffer
    _log_buffer.clear()
    _append_log("--- Logs cleared by user ---")
    return {"success": True}


@router.get("/applied-jobs")
async def get_applied_jobs(user: User = Depends(get_current_user)):
    """Return the full list of applied jobs."""
    jobs = _load_json(_APPLIED_FILE, [])
    # Add original_index for frontend CRUD operations
    for i, job in enumerate(jobs):
        job["original_index"] = i
    return {"jobs": list(reversed(jobs)), "total": len(jobs)}


@router.post("/applied-jobs/{index}/mark")
async def mark_job(index: int, user: User = Depends(get_current_user)):
    """Toggle a job between 'External - Ready' and 'Manually Applied'."""
    jobs = _load_json(_APPLIED_FILE, [])
    if index < 0 or index >= len(jobs):
        raise HTTPException(status_code=404, detail="Job index out of range.")
    
    current_status = jobs[index].get("status", "")
    if current_status == "Manually Applied":
        jobs[index]["status"] = "External - Ready"
    else:
        jobs[index]["status"] = "Manually Applied"
    
    _save_json(_APPLIED_FILE, jobs)
    return {"success": True, "new_status": jobs[index]["status"]}


@router.delete("/applied-jobs/{index}")
async def delete_job(index: int, user: User = Depends(get_current_user)):
    """Remove a job entry from the applied list."""
    jobs = _load_json(_APPLIED_FILE, [])
    if index < 0 or index >= len(jobs):
        raise HTTPException(status_code=404, detail="Job index out of range.")
    
    deleted = jobs.pop(index)
    _save_json(_APPLIED_FILE, jobs)
    return {"success": True, "deleted": deleted.get("title", "Unknown")}


@router.get("/config")
async def get_config(user: User = Depends(get_current_user)):
    """Return current job preferences."""
    prefs = _load_json(_PREFS_FILE, {})
    return {"config": prefs}


@router.put("/config")
async def update_config(payload: dict, user: User = Depends(get_current_user)):
    """
    Update and persist job preferences.
    Accepts partial updates — only provided keys are overwritten.
    """
    prefs = _load_json(_PREFS_FILE, {})
    
    allowed_keys = {"keywords", "experience_level", "job_type", "remote_only",
                    "max_applications_per_day", "search_limit", "countries", "platforms"}
    
    for key in allowed_keys:
        if key in payload:
            prefs[key] = payload[key]
    
    _save_json(_PREFS_FILE, prefs)
    return {"success": True, "config": prefs}


@router.get("/session-state")
async def get_session_state(user: User = Depends(get_current_user)):
    """Return the last session state (country, timestamps, etc.)."""
    state = _load_json(_STATE_FILE, {})
    return {"state": state}


# ── Credentials (stored per-user on server, never sent back to frontend) ──────

def _creds_file(user_id: str) -> Path:
    """
    Per-user encrypted-at-rest credentials stored in the autobot data dir.
    We don't store passwords in the DB — only in a server-side JSON file
    that is never exposed through any GET endpoint.
    """
    path = _DATA_DIR / "credentials" / f"{user_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


@router.post("/credentials")
async def save_credentials(
    payload: dict,
    user: User = Depends(get_current_user),
):
    """
    Save platform credentials (email + password) to a server-side file.
    Fields accepted:
      linkedin_email, linkedin_password,
      naukri_email, naukri_password,
      yc_email, yc_password
    Passwords are never returned via API — only saved.
    """
    allowed = {
        "linkedin_email", "linkedin_password",
        "naukri_email", "naukri_password",
        "yc_email", "yc_password",
    }
    creds_path = _creds_file(user.id)
    existing = _load_json(creds_path, {})

    updated_fields = []
    for key in allowed:
        if key in payload and payload[key] is not None:
            existing[key] = payload[key]
            updated_fields.append(key)

    _save_json(creds_path, existing)
    logger.info(f"[AUTOBOT] Credentials updated for user {user.id}: {updated_fields}")
    return {"success": True, "updated": updated_fields}


@router.get("/credentials/status")
async def credentials_status(
    user: User = Depends(get_current_user),
):
    """
    Returns which credentials are configured (true/false) WITHOUT exposing passwords.
    Emails are returned so the user knows which account is set.
    """
    creds_path = _creds_file(user.id)
    creds = _load_json(creds_path, {})
    return {
        "linkedin": {
            "email": creds.get("linkedin_email", ""),
            "has_password": bool(creds.get("linkedin_password")),
        },
        "naukri": {
            "email": creds.get("naukri_email", ""),
            "has_password": bool(creds.get("naukri_password")),
        },
        "ycombinator": {
            "email": creds.get("yc_email", ""),
            "has_password": bool(creds.get("yc_password")),
        },
    }


# ── Profile sync from parsed resume ──────────────────────────────────────────

def _extract_years_of_experience(experience_list: list) -> int:
    """Estimate total years from experience list items (looks for date patterns)."""
    total = 0
    year_pattern = re.compile(r'\b(20\d{2}|19\d{2})\b')
    for exp in experience_list:
        duration = str(exp.get("duration", ""))
        years_found = year_pattern.findall(duration)
        if len(years_found) >= 2:
            try:
                diff = abs(int(years_found[-1]) - int(years_found[0]))
                total += diff
            except:
                pass
        elif "present" in duration.lower() or "current" in duration.lower():
            years_found2 = year_pattern.findall(duration)
            if years_found2:
                try:
                    total += max(1, datetime.now().year - int(years_found2[0]))
                except:
                    total += 1
    return max(total, 0)


@router.get("/profile/from-resume")
async def profile_from_resume(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch the user's latest successfully parsed resume from the DB
    and extract autobot profile fields:
      - full_name, email (from User model)
      - skills, summary, years_of_experience, current_title (from parsed_json)
      - education level (from education list)
    Returns a profile dict ready to merge into job_prefs / env.
    """
    # Get user's latest parsed resume
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user.id, Resume.parse_status == "done")
        .order_by(Resume.created_at.desc())
        .limit(1)
    )
    resume = result.scalar_one_or_none()

    if not resume:
        # Try any resume even if not fully parsed
        result2 = await db.execute(
            select(Resume)
            .where(Resume.user_id == user.id)
            .order_by(Resume.created_at.desc())
            .limit(1)
        )
        resume = result2.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Please upload a resume in the Resume section first."
        )

    parsed = resume.parsed_json or {}

    # ── Extract skills ────────────────────────────────────────────────────────
    raw_skills = parsed.get("skills", [])
    # Could be list of strings or list of dicts
    skills: list[str] = []
    for s in raw_skills:
        if isinstance(s, str):
            skills.append(s.strip())
        elif isinstance(s, dict):
            # Some parsers return {"name": "Python", "level": "expert"}
            skills.append(str(s.get("name") or s.get("skill") or "").strip())
    skills = [s for s in skills if s]

    # ── Extract experience ────────────────────────────────────────────────────
    experience_list = parsed.get("experience", [])
    current_title = ""
    if experience_list:
        # Most recent experience is usually first
        first = experience_list[0]
        if isinstance(first, dict):
            current_title = (
                first.get("role") or first.get("title") or
                first.get("position") or first.get("company") or ""
            ).strip()
    years_exp = _extract_years_of_experience(experience_list)

    # ── Extract education ─────────────────────────────────────────────────────
    education_list = parsed.get("education", [])
    education_str = ""
    if education_list:
        first_edu = education_list[0]
        if isinstance(first_edu, dict):
            degree = first_edu.get("degree", "")
            school = first_edu.get("school", first_edu.get("institution", ""))
            education_str = f"{degree} — {school}".strip(" —")
        elif isinstance(first_edu, str):
            education_str = first_edu

    # ── Build autobot profile payload ─────────────────────────────────────────
    profile = {
        # From User model
        "full_name":  user.full_name or "",
        "email":      user.email or "",
        # From resume parsing
        "skills":     skills,
        "summary":    parsed.get("summary", ""),
        "years_of_experience": years_exp,
        "current_title":      current_title,
        "education":          education_str,
        # Metadata
        "resume_id":    resume.id,
        "resume_name":  resume.file_name,
        "parse_status": resume.parse_status,
        "ats_score":    resume.ats_score,
    }

    return {"profile": profile, "source": "resume"}


def _profile_file(user_id: str) -> Path:
    path = _DATA_DIR / "profiles" / f"{user_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


@router.get("/profile")
async def get_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the saved bot profile. Fall back to parsed resume if not saved yet."""
    profile_path = _profile_file(user.id)
    if profile_path.exists():
        return {"profile": _load_json(profile_path, {}), "source": "saved"}
    
    # Fallback to parsed resume
    try:
        res = await profile_from_resume(user, db)
        return {"profile": res["profile"], "source": "resume"}
    except HTTPException:
        return {
            "profile": {
                "full_name": user.full_name or "",
                "email": user.email or "",
                "phone": "",
                "city": "India",
                "country": "India",
                "skills": [],
                "years_of_experience": 0,
                "current_title": "",
                "education": "",
            },
            "source": "empty"
        }


@router.put("/profile")
async def update_profile(
    payload: dict,
    user: User = Depends(get_current_user),
):
    """Save/update the user's bot profile."""
    profile_path = _profile_file(user.id)
    existing = _load_json(profile_path, {})
    
    allowed = {
        "full_name", "email", "phone", "city", "country",
        "linkedin_url", "portfolio_url", "github_url",
        "skills", "years_of_experience", "current_title", "education", "summary"
    }
    
    for key in allowed:
        if key in payload:
            existing[key] = payload[key]
            
    _save_json(profile_path, existing)
    return {"success": True, "profile": existing}
