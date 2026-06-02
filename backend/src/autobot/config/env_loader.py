"""
env_loader.py
─────────────
Builds the profile & prefs dicts for the autobot from the backend environment.
All credentials are loaded from environment variables (prefixed with AUTOBOT_)
so they never touch the frontend.
"""

import os
import json
import logging
from pathlib import Path

log = logging.getLogger(__name__)

# ── Locate config and data dirs relative to this file ──
_CONFIG_DIR = Path(__file__).resolve().parent
_DATA_DIR   = _CONFIG_DIR.parent / "data"


def _get(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip()


def build_profile() -> dict:
    """Build the 'profile' dict from environment variables (AUTOBOT_ prefix)."""
    skills_raw = _get("AUTOBOT_SKILLS", _get("SKILLS", "Python,JavaScript,React"))
    skills = [s.strip() for s in skills_raw.split(",") if s.strip()]

    # AI config — reuse the main OPENROUTER key if autobot-specific one isn't set
    openrouter_key = _get("AUTOBOT_OPENROUTER_API_KEY") or _get("OPENROUTER_API_KEY")

    return {
        "personal": {
            "full_name":      _get("AUTOBOT_FULL_NAME", _get("FULL_NAME", "Applicant")),
            "email":          _get("AUTOBOT_PERSONAL_EMAIL", _get("AUTOBOT_LINKEDIN_EMAIL", "")),
            "phone":          _get("AUTOBOT_PHONE", _get("PHONE", "")),
            "city":           _get("AUTOBOT_CITY", _get("CITY", "India")),
            "country":        _get("AUTOBOT_COUNTRY", _get("COUNTRY", "India")),
            "linkedin_url":   _get("AUTOBOT_LINKEDIN_URL", _get("LINKEDIN_URL", "")),
            "portfolio_url":  _get("AUTOBOT_PORTFOLIO_URL", _get("PORTFOLIO_URL", "")),
            "github_url":     _get("AUTOBOT_GITHUB_URL", _get("GITHUB_URL", "")),
        },
        "credentials": {
            "linkedin_email":    _get("AUTOBOT_LINKEDIN_EMAIL", _get("LINKEDIN_EMAIL", "")),
            "linkedin_password": _get("AUTOBOT_LINKEDIN_PASSWORD", _get("LINKEDIN_PASSWORD", "")),
            "naukri_email":      _get("AUTOBOT_NAUKRI_EMAIL", _get("NAUKRI_EMAIL", "")),
            "naukri_password":   _get("AUTOBOT_NAUKRI_PASSWORD", _get("NAUKRI_PASSWORD", "")),
            "yc_email":          _get("AUTOBOT_YC_EMAIL", _get("YC_EMAIL", "")),
            "yc_password":       _get("AUTOBOT_YC_PASSWORD", _get("YC_PASSWORD", "")),
        },
        "cv": {
            "cv_path":        _get("AUTOBOT_CV_PATH", _get("CV_PATH", "active_resume.pdf")),
            "resume_summary": _get("AUTOBOT_RESUME_SUMMARY", _get("RESUME_SUMMARY", "")),
        },
        "experience": {
            "years_of_experience": int(_get("AUTOBOT_YEARS_EXP", _get("YEARS_OF_EXPERIENCE", "1"))),
            "current_title":       _get("AUTOBOT_CURRENT_TITLE", _get("CURRENT_TITLE", "Software Engineer")),
            "skills":              skills,
            "education":           _get("AUTOBOT_EDUCATION", _get("EDUCATION", "Bachelor's Degree")),
            "notice_period_days":  int(_get("AUTOBOT_NOTICE_PERIOD", _get("NOTICE_PERIOD_DAYS", "0"))),
            "salary_expectation":  _get("AUTOBOT_SALARY", _get("SALARY_EXPECTATION", "negotiable")),
            "willing_to_relocate": _get("AUTOBOT_WILLING_TO_RELOCATE", "true").lower() == "true",
            "work_authorization":  _get("AUTOBOT_WORK_AUTH", "Yes"),
            "requires_sponsorship": _get("AUTOBOT_REQUIRES_SPONSORSHIP", "false").lower() == "true",
        },
        "ai": {
            "provider":                "openrouter",
            "openrouter_api_key":      openrouter_key,
            "openrouter_base_url":     _get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            "openrouter_default_model": _get("OPENROUTER_DEFAULT_MODEL", "google/gemma-4-31b-it:free"),
            "api_key":  _get("AI_API_KEY"),
            "model":    _get("AI_MODEL", "gemini-2.0-flash"),
        },
    }


def load_configs() -> tuple[dict, dict]:
    """
    Load profile from env vars and job_prefs from config/job_prefs.json.
    Returns (profile, prefs).
    """
    profile = build_profile()

    if not profile["credentials"]["linkedin_email"]:
        log.warning("⚠️  AUTOBOT_LINKEDIN_EMAIL is not set")
    if not profile["credentials"]["linkedin_password"]:
        log.warning("⚠️  AUTOBOT_LINKEDIN_PASSWORD is not set")

    prefs_path = _CONFIG_DIR / "job_prefs.json"
    if prefs_path.exists():
        with open(prefs_path, "r") as f:
            prefs = json.load(f)
    else:
        log.warning("job_prefs.json not found — using defaults.")
        prefs = {
            "keywords": ["Software Engineer"],
            "countries": [{"country": "India", "priority": 1, "active": True}],
            "remote_only": False,
            "experience_level": ["Entry level", "Mid-Senior level"],
            "job_type": ["Full-time"],
            "max_applications_per_day": 50,
            "search_limit": 10,
            "platforms": {"linkedin": {"enabled": True}, "naukri": {"enabled": False}, "ycombinator": {"enabled": False}},
        }

    # Ensure data dir exists
    _DATA_DIR.mkdir(parents=True, exist_ok=True)

    return profile, prefs
