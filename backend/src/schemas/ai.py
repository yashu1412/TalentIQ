from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class AIChatRequest(BaseModel):
    user_id: str
    user_query: str
    resume_id: Optional[str] = None
    job_id: Optional[str] = None
    conversation_type: Optional[str] = "career_advice"

class AIChatResponse(BaseModel):
    answer: str
    chat_history: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

class CoverLetterRequest(BaseModel):
    user_id: str
    resume_id: str
    job_id: str
    tone: Optional[str] = "professional"

class CoverLetterResponse(BaseModel):
    content: str
    created_at: datetime
