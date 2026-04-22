from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, SmallInteger, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from src.core.db import Base


class LiveRoom(Base):
    __tablename__ = "live_rooms"

    id = Column(String, primary_key=True, index=True)
    room_key = Column(String(64), unique=True, nullable=False)  # Stream Video call ID
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    candidate_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String(16), default="open")          # open|active|closed
    is_locked = Column(Boolean, default=False)
    participant_limit = Column(SmallInteger, default=2)
    recording_url = Column(Text)                          # Stream recording URL
    notes_json = Column(JSON)                             # Interviewer structured notes
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    retention_tag = Column(String(32), default="standard")

    creator = relationship("User", foreign_keys=[created_by], back_populates="live_rooms_created")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    conversation_type = Column(String(32))   # mentor|resume|cover_letter|roadmap
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chats")
    messages = relationship("ChatMessage", back_populates="chat", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    chat_id = Column(String, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(16), nullable=False)  # user | assistant | system
    content = Column(Text, nullable=False)
    token_count = Column(SmallInteger)          # For LLM cost tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    chat = relationship("Chat", back_populates="messages")


class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    title = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    status = Column(String(16), default="saved")  # saved|applied|screening|interview|offer|rejected
    notes = Column(Text)
    next_step = Column(Text, nullable=True)
    reminder_at = Column(DateTime, nullable=True)
    applied_at = Column(DateTime)
    last_activity_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
