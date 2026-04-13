from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    jd_text: str
    parsed_json: Optional[Dict[str, Any]] = None
    source: Optional[str] = "manual_paste"

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationBase(BaseModel):
    user_id: str
    job_id: str
    resume_id: str
    status: Optional[str] = "applied"
    match_score: Optional[float] = None
    notes: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationResponse(ApplicationBase):
    id: int
    applied_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
