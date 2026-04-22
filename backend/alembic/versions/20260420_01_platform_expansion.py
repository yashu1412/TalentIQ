"""platform expansion baseline

Revision ID: 20260420_01
Revises:
Create Date: 2026-04-20
"""

from alembic import op
import sqlalchemy as sa


revision = "20260420_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("resumes", sa.Column("expires_at", sa.DateTime(), nullable=True))
    op.add_column("resumes", sa.Column("retention_tag", sa.String(length=32), nullable=True))
    op.add_column("document_embeddings", sa.Column("expires_at", sa.DateTime(), nullable=True))
    op.add_column("live_rooms", sa.Column("expires_at", sa.DateTime(), nullable=True))
    op.add_column("live_rooms", sa.Column("retention_tag", sa.String(length=32), nullable=True))
    op.add_column("chat_messages", sa.Column("expires_at", sa.DateTime(), nullable=True))
    op.add_column("applications", sa.Column("title", sa.String(length=255), nullable=True))
    op.add_column("applications", sa.Column("company", sa.String(length=255), nullable=True))
    op.add_column("applications", sa.Column("next_step", sa.Text(), nullable=True))
    op.add_column("applications", sa.Column("reminder_at", sa.DateTime(), nullable=True))
    op.add_column("applications", sa.Column("last_activity_at", sa.DateTime(), nullable=True))
    op.add_column("interviews", sa.Column("persona", sa.String(length=32), nullable=True))
    op.add_column("interviews", sa.Column("replay_json", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("interviews", "replay_json")
    op.drop_column("interviews", "persona")
    op.drop_column("applications", "last_activity_at")
    op.drop_column("applications", "reminder_at")
    op.drop_column("applications", "next_step")
    op.drop_column("applications", "company")
    op.drop_column("applications", "title")
    op.drop_column("chat_messages", "expires_at")
    op.drop_column("live_rooms", "retention_tag")
    op.drop_column("live_rooms", "expires_at")
    op.drop_column("document_embeddings", "expires_at")
    op.drop_column("resumes", "retention_tag")
    op.drop_column("resumes", "expires_at")
