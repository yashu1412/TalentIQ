import os
from typing import Callable

from fastapi import Depends, HTTPException


def _enabled(flag_name: str, default: str = "true") -> bool:
    value = os.getenv(flag_name, default).strip().lower()
    return value in ("1", "true", "yes", "on")


def get_flags() -> dict[str, bool]:
    return {
        "copilot_enabled": _enabled("FEATURE_COPILOT_ENABLED", "true"),
        "live_room_enabled": _enabled("FEATURE_LIVE_ROOM_ENABLED", "true"),
        "resume_pipeline_enabled": _enabled("FEATURE_RESUME_PIPELINE_ENABLED", "true"),
        "interview_replay_enabled": _enabled("FEATURE_INTERVIEW_REPLAY_ENABLED", "true"),
        "roadmap_enabled": _enabled("FEATURE_ROADMAP_ENABLED", "true"),
        "portfolio_eval_enabled": _enabled("FEATURE_PORTFOLIO_EVAL_ENABLED", "true"),
    }


def require_feature(flag_key: str) -> Callable[[], None]:
    def _guard() -> None:
        flags = get_flags()
        if not flags.get(flag_key, False):
            raise HTTPException(status_code=403, detail=f"Feature '{flag_key}' is disabled")

    return _guard


def feature_flags_dependency() -> dict[str, bool]:
    return get_flags()
