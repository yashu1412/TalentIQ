"""Add target_role and experience_level to resumes

Revision ID: 20260429_02
Revises: 20260420_01
Create Date: 2026-04-29
"""

from alembic import op
import sqlalchemy as sa


revision = "20260429_02"
down_revision = "20260420_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "resumes",
        sa.Column("target_role", sa.String(length=64), nullable=True,
                  server_default="Software Engineer"),
    )
    op.add_column(
        "resumes",
        sa.Column("experience_level", sa.String(length=16), nullable=True,
                  server_default="fresher"),
    )


def downgrade() -> None:
    op.drop_column("resumes", "experience_level")
    op.drop_column("resumes", "target_role")
