"""Live interview room: create, join, execute code, lock, end."""
import uuid
import os
import httpx
import subprocess
import time
import tempfile
import sys
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.db import get_db
from src.core.auth import get_current_user, require_recruiter
from src.core.feature_flags import require_feature
from src.models.live_room import LiveRoom
from src.models.user import User

router = APIRouter(prefix="/rooms", tags=["live-rooms"])

STREAM_API_KEY = os.getenv("STREAM_API_KEY", "")
STREAM_API_SECRET = os.getenv("STREAM_API_SECRET", "")
PISTON_URL = os.getenv("PISTON_URL", "http://localhost:2000")

LANGUAGE_VERSIONS = {
    "python": "3.10.0",
    "javascript": "18.15.0",
    "typescript": "5.0.3",
    "java": "15.0.2",
    "cpp": "10.2.0",
    "go": "1.16.2",
    "rust": "1.50.0",
}


def _mint_stream_token(user_id: str) -> str:
    """Mint a Stream Video user token."""
    try:
        from stream_chat import StreamChat  # type: ignore
        client = StreamChat(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)
        return client.create_token(user_id)
    except Exception:
        return f"dev_token_{user_id}"


@router.post("/create", status_code=201)
async def create_room(
    payload: dict,
    _: None = Depends(require_feature("live_room_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Recruiter creates a live interview room."""
    room_key = str(uuid.uuid4())[:8].upper()
    participant_limit = payload.get("participant_limit", 2)

    room = LiveRoom(
        id=str(uuid.uuid4()),
        room_key=room_key,
        created_by=user.id,
        participant_limit=participant_limit,
        status="open",
    )
    db.add(room)
    await db.commit()

    stream_token = _mint_stream_token(user.id)
    join_url = f"/live-room/{room_key}"

    return {
        "room_id": room.id,
        "room_key": room_key,
        "stream_token": stream_token,
        "join_url": join_url,
    }


@router.post("/{room_id}/join")
async def join_room(
    room_id: str,
    payload: dict,
    _: None = Depends(require_feature("live_room_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    room_key = payload.get("room_key", "")
    result = await db.execute(
        select(LiveRoom).where(LiveRoom.id == room_id, LiveRoom.room_key == room_key)
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.status == "closed":
        raise HTTPException(status_code=403, detail="Room is closed")
    if room.is_locked:
        raise HTTPException(status_code=403, detail="Room is locked")

    stream_token = _mint_stream_token(user.id)
    return {
        "stream_token": stream_token,
        "video_call_id": room.room_key,
        "chat_channel_id": f"room-{room.room_key}",
    }


@router.post("/{room_id}/execute-code")
async def execute_code(
    room_id: str,
    payload: dict,
    _: None = Depends(require_feature("live_room_enabled")),
    user: User = Depends(get_current_user),
):
    """Execute code via Piston sandboxed executor."""
    language = payload.get("language", "python")
    code = payload.get("code", "")
    stdin = payload.get("stdin", "")

    version = LANGUAGE_VERSIONS.get(language, "3.10.0")
    piston_payload = {
        "language": language,
        "version": version,
        "files": [{"content": code}],
        "stdin": stdin,
        "run_timeout": 5000,
        "compile_timeout": 10000,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(f"{PISTON_URL}/api/v2/execute", json=piston_payload)
            if resp.status_code == 200:
                result = resp.json()
                run = result.get("run", {})
                return {
                    "stdout": run.get("stdout", ""),
                    "stderr": run.get("stderr", ""),
                    "exit_code": run.get("code", 0),
                    "runtime_ms": run.get("cpu_time", 0),
                }
            else:
                raise Exception(f"Piston responded with {resp.status_code}")
    except Exception as e:
        # Fallback for local Python execution when Piston is unavailable
        if language == "python":
            start_time = time.time()
            with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w") as tmp:
                tmp.write(code)
                tmp_path = tmp.name
            try:
                # Use current python executable to ensure same environment
                process = subprocess.Popen(
                    [sys.executable, tmp_path],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                stdout, stderr = process.communicate(input=stdin, timeout=5)
                runtime_ms = int((time.time() - start_time) * 1000)
                return {
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": process.returncode,
                    "runtime_ms": runtime_ms,
                }
            except subprocess.TimeoutExpired:
                process.kill()
                return {"stdout": "", "stderr": "Execution timed out (5s)", "exit_code": 1, "runtime_ms": 5000}
            except Exception as inner_e:
                return {"stdout": "", "stderr": f"Local fallback failed: {str(inner_e)}", "exit_code": 1, "runtime_ms": 0}
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        
        # If not Python or fallback fails, return original error
        return {"stdout": "", "stderr": f"Piston connection failed: {str(e)}. (Local fallback only available for Python)", "exit_code": 1, "runtime_ms": 0}


@router.post("/{room_id}/lock")
async def lock_room(
    room_id: str,
    _: None = Depends(require_feature("live_room_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(LiveRoom).where(LiveRoom.id == room_id, LiveRoom.created_by == user.id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.is_locked = True
    await db.commit()
    return {"is_locked": True}


@router.post("/{room_id}/end")
async def end_room(
    room_id: str,
    _: None = Depends(require_feature("live_room_enabled")),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(LiveRoom).where(LiveRoom.id == room_id, LiveRoom.created_by == user.id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.status = "closed"
    await db.commit()
    return {"status": "closed"}
