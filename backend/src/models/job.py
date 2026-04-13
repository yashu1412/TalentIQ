from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, SmallInteger, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from src.core.db import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    source = Column(String(16), default="manual")   # manual | scraper
    title = Column(String(255), nullable=False)
    company = Column(String(255))
    location = Column(String(255))
    jd_text = Column(Text, nullable=False)           # Raw job description
    parsed_json = Column(JSON)                       # must_have[], nice_to_have[], years
    url = Column(Text)                               # Source URL if scraped
    created_at = Column(DateTime, default=datetime.utcnow)

    matches = relationship("JobMatch", back_populates="job")
    applications = relationship("Application", back_populates="job")


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(String, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    match_score = Column(SmallInteger)               # 0-100 weighted hybrid
    ats_score = Column(SmallInteger)                 # keyword density score
    missing_skills = Column(JSON, default=list)      # TEXT[]
    recommendations = Column(JSON, default=list)     # [{ skill, resource, priority }]
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="job_matches")
    resume = relationship("Resume", back_populates="job_matches")
    job = relationship("Job", back_populates="matches")
