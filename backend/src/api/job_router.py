"""Job analysis, matching and recommendations."""
import uuid
import os
import json
import re
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.db import get_db
from src.core.auth import get_current_user
from src.core.openrouter_client import get_openrouter_client, OR_DEFAULT_MODEL
from src.models.job import Job, JobMatch
from src.models.resume import Resume, ResumeVersion
from src.models.user import User

router = APIRouter(prefix="/jobs", tags=["jobs"])

COMMON_TECH_SKILLS = [
    "html", "css", "javascript", "typescript", "react", "next.js", "node.js", "express",
    "python", "java", "c++", "sql", "mysql", "mongodb", "postgresql", "redis",
    "git", "github", "rest api", "aws", "azure", "docker", "kubernetes", "tailwind",
    "fastapi", "graphql", "vercel", "linux", "data structures", "algorithms",
]


def _sanitize_jd_text(raw_text: str) -> tuple[str, list[str]]:
    """
    Remove obvious resume contamination from pasted JD input.
    Returns cleaned text and warning messages.
    """
    warnings: list[str] = []
    text = (raw_text or "").strip()
    if not text:
        return text, warnings

    # Hard split when a resume section appears in pasted content.
    split_markers = [
        r"\n\s*education\s*\n",
        r"\n\s*experience\s*\n",
        r"\n\s*projects\s*\n",
        r"\n\s*certifications\s*\n",
        r"\n\s*position of responsibility",
    ]
    lower_text = text.lower()
    cut_indexes = []
    for marker in split_markers:
        m = re.search(marker, lower_text, re.IGNORECASE)
        if m:
            cut_indexes.append(m.start())
    if cut_indexes:
        cut_at = min(cut_indexes)
        if cut_at > 350:
            text = text[:cut_at].strip()
            warnings.append("Detected resume-like sections in pasted JD. Using cleaned job-description portion only.")

    # If contact handles are present, this likely includes resume data.
    if re.search(r"[\w\.-]+@[\w\.-]+\.\w+|\+?\d[\d\-\s]{8,}", text):
        warnings.append("Detected contact details in input. Ensure only JD content is pasted for best match accuracy.")

    # Keep reasonable bound for parser prompt context.
    text = text[:8000]
    return text, warnings


def _fallback_extract_skills(jd_text: str) -> list[str]:
    """
    Keyword fallback when LLM output is sparse/invalid.
    """
    source = jd_text.lower()
    found: list[str] = []
    for skill in COMMON_TECH_SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, source):
            found.append(skill)
    return found[:20]


def _normalize_parsed_requirements(parsed: dict, jd_text: str, warnings: list[str]) -> dict:
    """
    Normalize keys and ensure parser output has usable minimum fields.
    """
    # Accept either legacy/new key names
    must_have = parsed.get("must_have_skills") or parsed.get("must_have") or []
    nice_to_have = parsed.get("nice_to_have_skills") or parsed.get("nice_to_have") or []
    bonus = parsed.get("bonus_skills") or parsed.get("bonus") or []
    tools = parsed.get("tools_technologies") or parsed.get("tools") or []

    # Normalize list values and dedupe while preserving order
    def _clean_list(values: list) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            text = str(value).strip()
            if text and text.lower() not in {v.lower() for v in cleaned}:
                cleaned.append(text)
        return cleaned

    must_have = _clean_list(must_have)
    nice_to_have = _clean_list(nice_to_have)
    bonus = _clean_list(bonus)
    tools = _clean_list(tools)

    if not must_have:
        fallback = _fallback_extract_skills(jd_text)
        if fallback:
            must_have = fallback[:10]
            warnings.append("LLM extraction returned weak requirements. Applied keyword fallback skill extraction.")

    total_requirement_signals = len(must_have) + len(nice_to_have) + len(tools)
    if total_requirement_signals < 2:
        warnings.append("JD appears low-detail (very few requirements extracted). Match confidence is limited.")

    # Lightweight title fallback from first line/header
    title = (parsed.get("title") or "").strip()
    if not title or title.lower() in {"unknown", "parsing..."}:
        first_line = jd_text.splitlines()[0].strip() if jd_text else ""
        if len(first_line) > 3 and len(first_line) < 100:
            title = re.sub(r"^[#\-\*\s]+", "", first_line)
        else:
            title = "Unknown"
        warnings.append("Job title confidence is low. Please verify role title manually.")

    normalized = {
        "title": title,
        "company": (parsed.get("company") or "").strip(),
        "location": (parsed.get("location") or "").strip(),
        "job_level": (parsed.get("job_level") or "").strip(),
        "years_required": int(parsed.get("years_required") or 0),
        "must_have_skills": must_have,
        "nice_to_have_skills": nice_to_have,
        "bonus_skills": bonus,
        "tools_technologies": tools,
        "required_education": _clean_list(parsed.get("required_education") or []),
        "required_certifications": _clean_list(parsed.get("required_certifications") or []),
        "soft_skills": _clean_list(parsed.get("soft_skills") or []),
        "summary": (parsed.get("summary") or "").strip(),
        "parse_warnings": warnings,
        "jd_quality": {
            "has_core_requirements": len(must_have) > 0,
            "warning_count": len(warnings),
            "input_length": len(jd_text),
        },
    }
    return normalized


def _fallback_extract_resume_skills(resume_text: str) -> list[str]:
    """
    Resume-side keyword fallback when parsed_json.skills is missing/empty.
    Re-uses the same COMMON_TECH_SKILLS list.
    """
    source = (resume_text or "").lower()
    found: list[str] = []
    for skill in COMMON_TECH_SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, source):
            found.append(skill)
    return found[:30]


def _ensure_resume_skills(resume_data: dict, resume_text: str) -> dict:
    """
    Ensure resume_data.skills is a non-empty list if possible.
    """
    skills = resume_data.get("skills")
    if isinstance(skills, str):
        resume_data["skills"] = [s.strip() for s in skills.split(",") if s.strip()]
        skills = resume_data["skills"]
    if not isinstance(skills, list):
        resume_data["skills"] = []
        skills = resume_data["skills"]

    if len(skills) == 0:
        fallback = _fallback_extract_resume_skills(resume_text)
        if fallback:
            resume_data["skills"] = fallback
    return resume_data


async def _extract_jd_requirements(jd_text: str) -> dict:
    """
    Comprehensive extraction of all requirements from JD.
    Extracts: title, company, must-have skills, nice-to-have skills,
    bonus skills, experience level, years required, tools, certifications,
    education, location, and job level/seniority.
    """
    logger = logging.getLogger("uvicorn.error")
    logger.info(f"[JD EXTRACTION] Starting extraction for JD text length: {len(jd_text)}")
    
    oai = get_openrouter_client()
    prompt = f"""Extract all structured requirements from this job description. Return valid JSON with:
{{
  "title": "job title",
  "company": "company name or empty",
  "location": "location or empty",
  "job_level": "junior/mid/senior/lead/architect or empty",
  "years_required": number (0 if not specified),
  "must_have_skills": ["list of critical required skills"],
  "nice_to_have_skills": ["list of preferred/nice-to-have skills"],
  "bonus_skills": ["list of bonus/optional skills"],
  "tools_technologies": ["required tools/frameworks/libraries"],
  "required_education": ["Bachelor's degree in CS", "relevant degree", etc. or empty list],
  "required_certifications": ["list of certifications or empty"],
  "soft_skills": ["leadership", "communication", etc. or empty],
  "summary": "brief overview of role responsibilities"
}}
Distinguish between must-have (critical), nice-to-have (preferred), and bonus (optional) requirements.
JD: {jd_text[:6000]}"""
    
    try:
        logger.info("[JD EXTRACTION] Calling OpenRouter API...")
        resp = await oai.chat.completions.create(
            model=OR_DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": "Return ONLY valid JSON. Do not include markdown formatting or extra text."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1500,
        )
        logger.info("[JD EXTRACTION] API response received successfully")
        content = resp.choices[0].message.content
        logger.info(f"[JD EXTRACTION] Response content: {content[:500]}...")
    except Exception as e:
        logger.error(f"[JD EXTRACTION] API call failed: {str(e)}")
        raise
    
    # Clean up response - remove markdown code blocks if present
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, re.DOTALL)
    if m:
        content = m.group(1)
    
    # Extract JSON object if wrapped in extra text
    obj = re.search(r"\{.*\}", content, re.DOTALL)
    if obj:
        content = obj.group(0)
    
    try:
        parsed = json.loads(content)
        logger.info(f"[JD EXTRACTION] JSON parsed successfully. Skills found: {len(parsed.get('must_have_skills', []))} must-have, {len(parsed.get('nice_to_have_skills', []))} nice-to-have")
    except json.JSONDecodeError as e:
        logger.error(f"[JD EXTRACTION] JSON parsing failed: {str(e)}")
        logger.error(f"[JD EXTRACTION] Content to parse: {content[:200]}")
        raise
    
    # Set defaults for missing fields
    defaults = {
        "title": "Unknown",
        "company": "",
        "location": "",
        "job_level": "",
        "years_required": 0,
        "must_have_skills": [],
        "nice_to_have_skills": [],
        "bonus_skills": [],
        "tools_technologies": [],
        "required_education": [],
        "required_certifications": [],
        "soft_skills": [],
        "summary": "",
    }
    
    for key, default_val in defaults.items():
        if key not in parsed:
            parsed[key] = default_val
    
    logger.info(f"[JD EXTRACTION] Final parsed result: {json.dumps(parsed, indent=2)[:500]}...")
    return parsed


@router.post("/analyze", status_code=202)
async def analyze_job(
    payload: dict,
    user: User = Depends(get_current_user),  # any authenticated user can analyze jobs
    db: AsyncSession = Depends(get_db),
):
    raw_jd_text = payload.get("jd_text", "")
    jd_text = raw_jd_text
    url = payload.get("url", "")
    if not jd_text and not url:
        raise HTTPException(status_code=400, detail="Provide jd_text or url")

    # If URL provided, fetch text
    if url and not jd_text:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, follow_redirects=True)
            jd_text = resp.text[:8000]

    cleaned_jd_text, parse_warnings = _sanitize_jd_text(jd_text)
    jd_text = cleaned_jd_text

    job_id = str(uuid.uuid4())
    job = Job(
        id=job_id,
        source="manual" if payload.get("jd_text") else "scraper",
        title="Parsing...",
        jd_text=jd_text,
        url=url,
    )
    db.add(job)
    await db.commit()

    # Parse asynchronously with comprehensive extraction
    try:
        logger = logging.getLogger("uvicorn.error")
        logger.info(f"[ANALYZE_JOB] Starting JD analysis for job_id={job_id}")
        parsed = await _extract_jd_requirements(jd_text)
        parsed = _normalize_parsed_requirements(parsed, jd_text, parse_warnings)
        job.title = parsed.get("title", "Unknown")
        job.company = parsed.get("company", "")
        job.location = parsed.get("location", "")
        job.parsed_json = parsed
        await db.commit()
        logger.info(f"[ANALYZE_JOB] Job parsed successfully. Title: {job.title}")
    except Exception as e:
        logger = logging.getLogger("uvicorn.error")
        import traceback
        logger.error(f"[ANALYZE_JOB] JD extraction failed for job_id={job_id}: {str(e)}")
        logger.error(f"[ANALYZE_JOB] Traceback: {traceback.format_exc()}")
        # Still save job with empty parsed_json so it doesn't fail
        fallback = _normalize_parsed_requirements(
            {
                "title": "Unknown",
                "company": "",
                "location": "",
                "job_level": "",
                "years_required": 0,
                "must_have_skills": [],
                "nice_to_have_skills": [],
                "bonus_skills": [],
                "tools_technologies": [],
                "required_education": [],
                "required_certifications": [],
                "soft_skills": [],
                "summary": "",
            },
            jd_text,
            parse_warnings + ["JD parser failed and fallback normalization was used."],
        )
        job.parsed_json = fallback
        await db.commit()

    return {"job_id": job_id, "status": "pending"}


@router.get("/{job_id}")
async def get_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "jd_text": job.jd_text,
        "parsed_json": job.parsed_json,
    }


# --- Matching ---
match_router = APIRouter(prefix="/matches", tags=["matches"])


def _normalize_skill(s: str) -> str:
    """Normalize skill name for comparison."""
    return re.sub(r'[^a-z0-9]', '', s.lower())


def _calculate_overlap(resume_skills: set, jd_skills: set) -> tuple:
    """Calculate skill overlap with fuzzy matching."""
    if not jd_skills:
        return 1.0, []
    if not resume_skills:
        return 0.0, list(jd_skills)

    norm_resume = {_normalize_skill(s) for s in resume_skills}
    
    match_count = 0
    missing = []
    
    for req in jd_skills:
        norm_req = _normalize_skill(req)
        # Exact normalized match or partial match
        if norm_req in norm_resume or any(norm_req in r or r in norm_req for r in norm_resume if len(r) > 2 and len(norm_req) > 2):
            match_count += 1
        else:
            missing.append(req)
            
    return match_count / len(jd_skills), missing


def _match_resume_to_jd_requirements(resume_data: dict, jd_requirements: dict) -> dict:
    """
    Comprehensive matching between resume and JD requirements.
    Evaluates:
    - Must-have skills match
    - Nice-to-have skills match
    - Bonus skills match
    - Experience level match
    - Tools/Technologies match
    - Education match
    Returns detailed breakdown and overall match score.
    """
    resume_skills = set(s.lower() for s in resume_data.get("skills", []))
    resume_experience = resume_data.get("years_experience", 0)
    resume_education = resume_data.get("education", [])
    resume_projects = resume_data.get("projects_count", 0)
    
    jd_must = set(s.lower() for s in jd_requirements.get("must_have_skills", []))
    jd_nice = set(s.lower() for s in jd_requirements.get("nice_to_have_skills", []))
    jd_bonus = set(s.lower() for s in jd_requirements.get("bonus_skills", []))
    jd_tools = set(s.lower() for s in jd_requirements.get("tools_technologies", []))
    jd_exp = jd_requirements.get("years_required", 0)
    jd_education = jd_requirements.get("required_education", [])
    jd_level = jd_requirements.get("job_level", "").lower()

    # If the JD has almost no structured requirements, avoid inflated scores.
    has_requirement_signal = bool(jd_must or jd_nice or jd_bonus or jd_tools or jd_exp or jd_education)
    if not has_requirement_signal:
        return {
            "overall_match_score": 35.0,
            "skill_match": {
                "must_have": {"ratio": 0.0, "matched": 0, "total": 0, "missing": []},
                "nice_to_have": {"ratio": 0.0, "matched": 0, "total": 0, "missing": []},
                "bonus": {"ratio": 0.0, "matched": 0, "total": 0, "missing": []},
            },
            "tools_match": {"ratio": 0.0, "matched": 0, "total": 0, "missing": []},
            "experience_match": {
                "resume_years": resume_experience,
                "required_years": 0,
                "score": 0.0,
                "meets_requirement": True,
            },
            "education_match": {
                "resume": resume_education,
                "required": [],
                "score": 0.0,
                "has_required": True,
            },
            "missing_critical_skills": [],
            "all_missing_skills": [],
            "analysis_warning": "JD has insufficient requirement detail. Score is conservative until a fuller JD is provided.",
        }
    
    # Calculate skill matches by tier
    must_ratio, missing_must = _calculate_overlap(resume_skills, jd_must)
    nice_ratio, missing_nice = _calculate_overlap(resume_skills, jd_nice)
    bonus_ratio, missing_bonus = _calculate_overlap(resume_skills, jd_bonus)
    tools_ratio, missing_tools = _calculate_overlap(resume_skills, jd_tools)
    
    # Experience level match (0-1)
    exp_score = 0.0
    if jd_exp > 0:
        # If they have equal or more experience, full score; else proportional
        exp_score = min(resume_experience / jd_exp, 1.0)
    else:
        exp_score = 1.0 if resume_experience > 0 else 0.8  # Default boost if no requirement
    
    # Education match (binary: 0 or 1)
    education_score = 1.0
    if jd_education and len(jd_education) > 0:
        education_found = False
        for req_edu in jd_education:
            if any(req_edu.lower() in edu.lower() or edu.lower() in req_edu.lower() 
                   for edu in resume_education):
                education_found = True
                break
        education_score = 1.0 if education_found else 0.6  # Penalty for missing required education
    
    # Comprehensive scoring formula:
    # 45% must-have skills (critical)
    # 20% nice-to-have skills
    # 10% bonus skills
    # 10% tools/technologies
    # 10% experience level
    # 5% education
    overall_score = (
        must_ratio * 0.45 +
        nice_ratio * 0.20 +
        bonus_ratio * 0.10 +
        tools_ratio * 0.10 +
        exp_score * 0.10 +
        education_score * 0.05
    )
    
    # Compile all missing skills
    all_missing_skills = list(set(missing_must + missing_nice + missing_tools))
    
    return {
        "overall_match_score": round(overall_score * 100, 2),
        "skill_match": {
            "must_have": {
                "ratio": round(must_ratio * 100, 2),
                "matched": len(jd_must) - len(missing_must),
                "total": len(jd_must),
                "missing": missing_must,
            },
            "nice_to_have": {
                "ratio": round(nice_ratio * 100, 2),
                "matched": len(jd_nice) - len(missing_nice),
                "total": len(jd_nice),
                "missing": missing_nice,
            },
            "bonus": {
                "ratio": round(bonus_ratio * 100, 2),
                "matched": len(jd_bonus) - len(missing_bonus),
                "total": len(jd_bonus),
                "missing": missing_bonus,
            },
        },
        "tools_match": {
            "ratio": round(tools_ratio * 100, 2),
            "matched": len(jd_tools) - len(missing_tools),
            "total": len(jd_tools),
            "missing": missing_tools,
        },
        "experience_match": {
            "resume_years": resume_experience,
            "required_years": jd_exp,
            "score": round(exp_score * 100, 2),
            "meets_requirement": resume_experience >= jd_exp,
        },
        "education_match": {
            "resume": resume_education,
            "required": jd_education,
            "score": round(education_score * 100, 2),
            "has_required": education_score == 1.0,
        },
        "missing_critical_skills": missing_must,
        "all_missing_skills": all_missing_skills,
    }



async def _llm_match_resume_to_jd(
    jd_text: str,
    resume_text: str,
    resume_data: dict,
    jd_requirements: dict,
    job_title: str,
    company_name: str,
) -> dict:
    """
    Use OpenRouter LLM to perform a comprehensive AI-powered match between
    the full JD text and resume text. Returns structured match analysis JSON.
    Falls back to rule-based matching on failure.
    """
    from src.core.openrouter_client import llm_create, OR_DEFAULT_MODEL
    logger = logging.getLogger("uvicorn.error")
    logger.info(f"[LLM MATCH] Starting AI match for job={job_title} @ {company_name}")

    system_prompt = (
        "You are an expert technical recruiter and career advisor. "
        "Analyze the fit between a job description and a resume. "
        "Return ONLY valid JSON — no markdown, no extra text."
    )

    user_prompt = f"""Compare this JD and resume and return a match analysis as JSON.

=== JOB DESCRIPTION ===
{jd_text[:5000]}

=== RESUME ===
{resume_text[:4000]}

=== PARSED JD REQUIREMENTS (for reference) ===
Must-have skills: {jd_requirements.get('must_have_skills', [])}
Nice-to-have skills: {jd_requirements.get('nice_to_have_skills', [])}
Tools/Tech: {jd_requirements.get('tools_technologies', [])}
Years required: {jd_requirements.get('years_required', 0)}
Education: {jd_requirements.get('required_education', [])}

=== RESUME PARSED DATA (for reference) ===
Skills: {resume_data.get('skills', [])}
Years experience: {resume_data.get('years_experience', 0)}
Education: {resume_data.get('education', [])}

Return this exact JSON structure:
{{
  "overall_match_score": <0-100 number>,
  "ats_score": <0-100 number, based on keyword overlap with must-have skills>,
  "skill_match": {{
    "must_have": {{
      "matched": <count>,
      "total": <count>,
      "ratio": <0-100>,
      "missing": ["list of unmatched must-have skills"]
    }},
    "nice_to_have": {{
      "matched": <count>,
      "total": <count>,
      "ratio": <0-100>,
      "missing": ["list of unmatched nice-to-have skills"]
    }},
    "bonus": {{
      "matched": <count>,
      "total": <count>,
      "ratio": <0-100>,
      "missing": []
    }}
  }},
  "tools_match": {{
    "ratio": <0-100>,
    "matched": <count>,
    "total": <count>,
    "missing": ["unmatched tools"]
  }},
  "experience_match": {{
    "resume_years": <number>,
    "required_years": <number>,
    "score": <0-100>,
    "meets_requirement": <true|false>
  }},
  "education_match": {{
    "resume": ["candidate education"],
    "required": ["required education"],
    "score": <0-100>,
    "has_required": <true|false>
  }},
  "missing_critical_skills": ["top critical missing skills"],
  "all_missing_skills": ["all missing skills combined"],
  "recommendations": [
    {{
      "skill": "specific skill or area",
      "priority": "critical|high|medium|low",
      "reason": "why this matters for this specific role",
      "action": "specific actionable step",
      "timeline": "1 week|2-4 weeks|1-3 months|ongoing",
      "resource": "specific resource name",
      "impact": "how this helps for the role",
      "category": "must_have|nice_to_have|experience|tools"
    }}
  ],
  "company_prep": [
    "interview prep tip 1",
    "interview prep tip 2",
    "interview prep tip 3",
    "interview prep tip 4"
  ],
  "strengths": ["key strengths of the candidate for this role"],
  "summary": "2-3 sentence overall assessment"
}}"""

    try:
        resp = await llm_create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=2500,
        )
        content = resp.choices[0].message.content
        logger.info(f"[LLM MATCH] Got response ({len(content)} chars)")

        # Strip markdown fences if present
        m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, re.DOTALL)
        if m:
            content = m.group(1)
        obj = re.search(r"\{.*\}", content, re.DOTALL)
        if obj:
            content = obj.group(0)

        result = json.loads(content)
        logger.info(f"[LLM MATCH] Match score: {result.get('overall_match_score')}, ATS: {result.get('ats_score')}")
        return result

    except Exception as e:
        logger.error(f"[LLM MATCH] LLM call failed: {e}, falling back to rule-based")
        # Fallback to rule-based matching
        fallback = _match_resume_to_jd_requirements(resume_data, jd_requirements)
        fallback["recommendations"] = []
        fallback["company_prep"] = [
            f"Review {company_name or 'company'} engineering values and culture",
            f"Prepare 2-3 STAR stories aligned with {job_title or 'the role'} responsibilities",
            "Rehearse technical discussion on core requirements",
        ]
        fallback["strengths"] = []
        fallback["summary"] = ""
        fallback["ats_score"] = int(fallback["skill_match"]["must_have"]["ratio"])
        return fallback


@match_router.post("/create", status_code=202)
async def create_match(
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger = logging.getLogger("uvicorn.error")
    resume_id = payload.get("resume_id")
    job_id = payload.get("job_id")
    if not resume_id or not job_id:
        raise HTTPException(status_code=400, detail="resume_id and job_id required")

    r_result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
    resume = r_result.scalar_one_or_none()
    j_result = await db.execute(select(Job).where(Job.id == job_id))
    job = j_result.scalar_one_or_none()

    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or Job not found")

    # Gather full texts for LLM
    jd_text = job.jd_text or ""
    resume_text = resume.raw_text or ""

    # Parsed structured data
    resume_data = resume.parsed_json or {}
    resume_data = _ensure_resume_skills(resume_data, resume_text)
    resume_data.setdefault("years_experience", 0)
    resume_data.setdefault("education", [])
    resume_data.setdefault("projects_count", 0)

    jd_requirements = job.parsed_json or {}
    jd_requirements.setdefault("must_have_skills", [])
    jd_requirements.setdefault("nice_to_have_skills", [])
    jd_requirements.setdefault("bonus_skills", [])
    jd_requirements.setdefault("tools_technologies", [])
    jd_requirements.setdefault("years_required", 0)
    jd_requirements.setdefault("required_education", [])

    logger.info(f"[MATCH CREATE] Running LLM match for resume={resume_id}, job={job_id}")

    # ── AI-powered matching via OpenRouter LLM ──
    match_analysis = await _llm_match_resume_to_jd(
        jd_text=jd_text,
        resume_text=resume_text,
        resume_data=resume_data,
        jd_requirements=jd_requirements,
        job_title=job.title or "",
        company_name=job.company or "",
    )

    match_score = int(match_analysis.get("overall_match_score", 0))
    ats_score = int(match_analysis.get("ats_score", match_analysis.get("skill_match", {}).get("must_have", {}).get("ratio", 0)))
    missing_skills = match_analysis.get("missing_critical_skills", [])
    recommendations = match_analysis.get("recommendations", [])
    company_prep = match_analysis.get("company_prep", [])

    # Guardrail: if JD extraction is weak, cap confidence so scores don't look falsely perfect.
    jd_quality = jd_requirements.get("jd_quality", {})
    if not jd_quality.get("has_core_requirements", True):
        match_score = min(match_score, 55)
        ats_score = min(ats_score, 55)
        match_analysis["analysis_warning"] = (
            "JD requirements were weak/limited, so score is capped. Paste a fuller JD for accurate matching."
        )

    match = JobMatch(
        id=str(uuid.uuid4()),
        user_id=user.id,
        resume_id=resume_id,
        job_id=job_id,
        match_score=match_score,
        ats_score=ats_score,
        missing_skills=missing_skills,
        recommendations=recommendations,
    )
    db.add(match)
    await db.commit()
    logger.info(f"[MATCH CREATE] Saved match={match.id}, score={match_score}, ats={ats_score}")

    return {
        "match_id": match.id,
        "status": "done",
        "match_score": match_score,
        "ats_score": ats_score,
        "detailed_analysis": match_analysis,
        "company_prep": company_prep,
    }


@match_router.get("/{match_id}")
async def get_match(
    match_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobMatch).where(JobMatch.id == match_id, JobMatch.user_id == user.id)
    )
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return {
        "match_id": match.id,
        "match_score": match.match_score,
        "ats_score": match.ats_score,
        "missing_skills": match.missing_skills,
        "recommendations": match.recommendations,
        "created_at": match.created_at.isoformat() if match.created_at else None,
    }


async def _generate_ai_recommendations(
    resume_data: dict,
    jd_requirements: dict,
    detailed_analysis: dict,
    job_title: str,
    company_name: str,
) -> list:
    """
    Generate AI-powered personalized recommendations based on comprehensive match analysis.
    Uses LLM to provide strategic, actionable insights for skill gaps and preparation.
    """
    logger = logging.getLogger("uvicorn.error")
    logger.info("[AI RECOMMENDATIONS] Starting AI recommendation generation")
    
    oai = get_openrouter_client()
    
    # Build context from analysis
    missing_must = detailed_analysis.get("skill_match", {}).get("must_have", {}).get("missing", [])
    missing_nice = detailed_analysis.get("skill_match", {}).get("nice_to_have", {}).get("missing", [])
    missing_tools = detailed_analysis.get("skill_match", {}).get("tools_match", {}).get("missing", [])
    exp_gap = detailed_analysis.get("experience_match", {}).get("required_years", 0) - detailed_analysis.get("experience_match", {}).get("resume_years", 0)
    
    prompt = f"""You are a career advisor. Based on this job match analysis, provide 5-7 strategic, highly personalized recommendations.

JOB: {job_title} at {company_name}
RESUME SKILLS: {resume_data.get('skills', [])}
RESUME EXPERIENCE: {resume_data.get('years_experience', 0)} years

CRITICAL GAPS (Must-Have Missing): {missing_must}
PREFERRED GAPS (Nice-to-Have Missing): {missing_nice}
TOOL GAPS: {missing_tools}
EXPERIENCE GAP: {exp_gap} years needed

Return ONLY valid JSON array with 5-7 recommendation objects. Each object:
{{
  "skill": "specific skill or area",
  "priority": "critical|high|medium|low",
  "reason": "why this matters for this specific role",
  "action": "specific actionable step (e.g., 'Complete Stanford's ML course on Coursera')",
  "timeline": "1 week|2-4 weeks|1-3 months|ongoing",
  "resource": "specific resource name or link",
  "impact": "how this skill helps for {job_title} at {company_name}"
}}

Focus on:
1. Most critical missing skills first
2. Quick wins (certifications, short courses)
3. Practical exercises relevant to the role
4. Real projects that demonstrate capability
5. Company/industry-specific knowledge"""

    try:
        logger.info("[AI RECOMMENDATIONS] Calling OpenRouter API for recommendations")
        resp = await oai.chat.completions.create(
            model=OR_DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": "You are a career advisor. Return ONLY valid JSON array. Do not include markdown formatting."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2000,
        )
        content = resp.choices[0].message.content
        logger.info(f"[AI RECOMMENDATIONS] API response received: {content[:300]}...")
    except Exception as e:
        logger.error(f"[AI RECOMMENDATIONS] API call failed: {str(e)}")
        raise

    # Clean up JSON response
    m = re.search(r"\[.*\]", content, re.DOTALL)
    if m:
        content = m.group(0)

    try:
        recommendations = json.loads(content)
        logger.info(f"[AI RECOMMENDATIONS] Successfully parsed {len(recommendations)} recommendations")
        return recommendations
    except json.JSONDecodeError as e:
        logger.error(f"[AI RECOMMENDATIONS] JSON parsing failed: {str(e)}")
        logger.error(f"[AI RECOMMENDATIONS] Content to parse: {content[:200]}")
        # Fallback: return basic recommendations
        return []


@match_router.post("/{match_id}/ai-recommendations")
async def generate_ai_recommendations(
    match_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI-powered personalized recommendations for a specific match."""
    logger = logging.getLogger("uvicorn.error")
    logger.info(f"[AI REC ENDPOINT] Generating AI recommendations for match_id={match_id}")
    
    result = await db.execute(select(JobMatch).where(JobMatch.id == match_id, JobMatch.user_id == user.id))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    r_result = await db.execute(select(Resume).where(Resume.id == match.resume_id))
    resume = r_result.scalar_one_or_none()
    
    j_result = await db.execute(select(Job).where(Job.id == match.job_id))
    job = j_result.scalar_one_or_none()

    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or Job not found")

    resume_data = resume.parsed_json or {}
    jd_requirements = job.parsed_json or {}
    
    try:
        # Generate comprehensive matching analysis for AI context
        detailed_analysis = _match_resume_to_jd_requirements(resume_data, jd_requirements)
        
        # Generate AI recommendations
        ai_recommendations = await _generate_ai_recommendations(
            resume_data,
            jd_requirements,
            detailed_analysis,
            job.title or "Unknown Role",
            job.company or "Unknown Company",
        )
        
        # Update match with new recommendations
        match.recommendations = ai_recommendations
        await db.commit()
        
        logger.info(f"[AI REC ENDPOINT] Successfully generated {len(ai_recommendations)} AI recommendations")
        return {
            "match_id": match_id,
            "recommendations": ai_recommendations,
            "generated_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"[AI REC ENDPOINT] Failed to generate recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate AI recommendations")



async def user_matches(
    user_id_param: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobMatch).where(JobMatch.user_id == user.id).order_by(JobMatch.created_at.desc())
    )
    matches = result.scalars().all()
    return [
        {
            "id": m.id,
            "job_id": m.job_id,
            "resume_id": m.resume_id,
            "match_score": m.match_score,
            "ats_score": m.ats_score,
            "missing_skills": m.missing_skills,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in matches
    ]


@match_router.post("/ats-simulate")
async def ats_simulate(
    payload: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compare multiple resume versions against JD requirements."""
    resume_id = payload.get("resume_id")
    job_id = payload.get("job_id")
    compare_latest_versions = bool(payload.get("compare_latest_versions", True))
    if not resume_id or not job_id:
        raise HTTPException(status_code=400, detail="resume_id and job_id required")

    r_result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
    resume = r_result.scalar_one_or_none()
    j_result = await db.execute(select(Job).where(Job.id == job_id))
    job = j_result.scalar_one_or_none()
    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or Job not found")

    # Extract JD requirements
    jd_requirements = job.parsed_json or {}
    jd_requirements.setdefault("must_have_skills", [])
    jd_requirements.setdefault("nice_to_have_skills", [])
    jd_requirements.setdefault("bonus_skills", [])
    jd_requirements.setdefault("tools_technologies", [])
    
    # Collect all resume versions to compare
    versions = [{"version": resume.current_version or 1, "data": resume.parsed_json or {}}]
    if compare_latest_versions:
        v_result = await db.execute(
            select(ResumeVersion)
            .where(ResumeVersion.resume_id == resume.id)
            .order_by(ResumeVersion.version_number.desc())
            .limit(3)
        )
        for v in v_result.scalars().all():
            if v.version_number != (resume.current_version or 1):  # Avoid duplicates
                versions.append({"version": v.version_number, "data": v.content_json or {}})

    seen_versions = {}
    comparison = []
    for version_item in versions:
        version_number = version_item["version"]
        if version_number in seen_versions:
            continue
        seen_versions[version_number] = True
        
        # Match this version against JD
        resume_data = version_item["data"]
        resume_data = _ensure_resume_skills(resume_data, resume.raw_text or "")
        resume_data.setdefault("years_experience", 0)
        resume_data.setdefault("education", [])
        resume_data.setdefault("projects_count", 0)
        
        match_analysis = _match_resume_to_jd_requirements(resume_data, jd_requirements)
        
        comparison.append({
            "version": version_number,
            "overall_match_score": match_analysis["overall_match_score"],
            "must_have_match": match_analysis["skill_match"]["must_have"]["ratio"],
            "ats_score": int(match_analysis["skill_match"]["must_have"]["ratio"]),
            "matched_keywords": match_analysis["skill_match"]["must_have"]["matched"],
            "missing_critical": len(match_analysis["skill_match"]["must_have"]["missing"]),
        })

    comparison.sort(key=lambda x: x["version"])
    best = max(comparison, key=lambda x: x["overall_match_score"]) if comparison else None
    
    return {
        "job_id": job.id,
        "resume_id": resume.id,
        "jd_title": job.title,
        "comparison": comparison,
        "best_version": best,
        "improvement_potential": f"Focus on {len(comparison) - 1} missing critical skills to improve match" if comparison else None,
    }
