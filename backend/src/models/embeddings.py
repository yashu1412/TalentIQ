from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, SmallInteger, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from src.core.db import Base
from pgvector.sqlalchemy import Vector


class DocumentEmbedding(Base):
    """pgvector table for semantic memory and similarity search."""
    __tablename__ = "document_embeddings"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(String(32), nullable=False)  # resume|jd|chat|note|transcript
    doc_id = Column(String, nullable=False)         # FK to source table row
    chunk_index = Column(SmallInteger)              # Chunk order within document
    content = Column(Text, nullable=False)          # Raw chunk text
    embedding = Column(Vector(1536), nullable=False)  # OpenAI ada-002 dimensions
    metadata_json = Column(JSON)                    # { section, source, created_at }
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
