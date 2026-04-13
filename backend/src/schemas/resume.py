from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class ResumeBase(BaseModel):
    user_id: str
    file_url: Optional[str] = None
    raw_text: Optional[str] = None
    parsed_json: Optional[Dict[str, Any]] = None
    ats_score: Optional[int] = None

class ResumeCreate(ResumeBase):
    pass

class ResumeResponse(ResumeBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResumeVersionResponse(BaseModel):
    id: int
    resume_id: str
    version_number: int
    content_json: Dict[str, Any]
    improvement_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
