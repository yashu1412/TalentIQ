from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Integer, SmallInteger, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from src.core.db import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(Text, nullable=False)          # S3 / Cloudinary URL
    file_name = Column(String(255))                  # Original filename
    raw_text = Column(Text)                          # Full extracted text
    parsed_json = Column(JSON)                       # Structured skills, exp, edu, projects
    ats_score = Column(SmallInteger)                 # 0-100
    quality_score = Column(SmallInteger)             # 0-100
    parse_status = Column(String(16), default="pending")   # pending|done|failed
    current_version = Column(SmallInteger, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    retention_tag = Column(String(32), default="standard")
    target_role = Column(String(64), default="fullstack_developer")   # user-selected role
    experience_level = Column(String(16), default="fresher")          # fresher|intermediate|advanced

    user = relationship("User", back_populates="resumes")
    versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")
    job_matches = relationship("JobMatch", back_populates="resume")


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(String, primary_key=True, index=True)
    resume_id = Column(String, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(SmallInteger, nullable=False)
    content_json = Column(JSON, nullable=False)     # Snapshot of parsed_json
    diff_summary = Column(Text)                     # Human-readable change notes
    created_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="versions")
