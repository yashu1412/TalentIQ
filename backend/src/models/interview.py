from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, SmallInteger, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from src.core.db import Base


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(32))              # hr|technical|coding|system_design
    mode = Column(String(16))             # text | voice | live
    persona = Column(String(32), default="balanced")
    status = Column(String(16), default="pending")  # pending|active|done
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)
    overall_score = Column(SmallInteger)  # 0-100
    feedback_json = Column(JSON)          # Summary + coaching tips
    transcript_url = Column(Text)         # S3 URL for voice transcripts
    replay_json = Column(JSON)            # Turn-by-turn replay timeline
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="interview", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String, primary_key=True, index=True)
    interview_id = Column(String, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    sequence = Column(SmallInteger, nullable=False)   # Display order
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text)                        # User's submitted answer
    score = Column(SmallInteger)                      # 0-100
    feedback = Column(Text)                           # Per-question LLM feedback
    dimension_scores = Column(JSON)                   # { accuracy, clarity, relevance, ... }

    interview = relationship("Interview", back_populates="questions")
