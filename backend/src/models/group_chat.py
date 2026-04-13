from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from src.core.db import Base

# Association table for Group Members
group_members = Table(
    "group_members",
    Base.metadata,
    Column("user_id", String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", String, ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
)

class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    shared_code = Column(Text, default="# Start collaborative coding...")
    shared_language = Column(String(32), default="python")
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", foreign_keys=[creator_id])
    members = relationship("User", secondary=group_members, backref="joined_groups")
    messages = relationship("GroupMessage", back_populates="group", cascade="all, delete-orphan")

class GroupMessage(Base):
    __tablename__ = "group_messages"

    id = Column(String, primary_key=True, index=True)
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="messages")
    sender = relationship("User")

class GroupFile(Base):
    __tablename__ = "group_files"

    id = Column(String, primary_key=True, index=True)
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(Text, nullable=False)
    file_type = Column(String(64))
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", backref="files")
    sender = relationship("User")
