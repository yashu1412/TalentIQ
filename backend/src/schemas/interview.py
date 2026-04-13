from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class InterviewBase(BaseModel):
    user_id: str
    type: str # technical_theory, hr, coding, system_design
    mode: str # text_based, voice_based
    status: Optional[str] = "pending"
    score: Optional[int] = None
    transcript_url: Optional[str] = None
    feedback_json: Optional[Dict[str, Any]] = None

class InterviewCreate(InterviewBase):
    pass

class InterviewResponse(InterviewBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InterviewQuestionRequest(BaseModel):
    role: str
    resume_id: str
    job_id: Optional[str] = None

class InterviewQuestionResponse(BaseModel):
    questions: List[str]
    created_at: datetime

class AnswerEvaluationRequest(BaseModel):
    question: str
    answer: str
    role: str

class AnswerEvaluationResponse(BaseModel):
    score: int
    feedback: str
    strengths: List[str]
    areas_for_improvement: List[str]
    sample_answer: str
    created_at: datetime
