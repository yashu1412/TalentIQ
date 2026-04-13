from sqlalchemy import Column, String, DateTime, JSON, Text, ARRAY, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from src.core.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # clerk_user_id
    clerk_user_id = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="candidate")  # candidate | recruiter | admin
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    job_matches = relationship("JobMatch", back_populates="user", cascade="all, delete-orphan")
    live_rooms_created = relationship("LiveRoom", foreign_keys="LiveRoom.created_by", back_populates="creator")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True, index=True)
    target_roles = Column(JSON, default=list)   # TEXT[]
    experience_level = Column(String)            # fresher|junior|mid|senior
    preferred_locations = Column(JSON, default=list)
    skills_summary = Column(Text)               # AI-generated
    bio = Column(Text)
    goals_json = Column(JSON)                   # Structured career goals

    user = relationship("User", back_populates="profile")
