"""Align PostgreSQL types and timestamp nullability with the ORM metadata.

Revision ID: 20260910_0025
Revises: 20260908_0024
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260910_0025"
down_revision = "20260908_0024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "landing_pages",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        existing_server_default=sa.func.now(),
        nullable=False,
    )
    op.alter_column(
        "landing_pages",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        existing_server_default=sa.func.now(),
        nullable=False,
    )
    op.alter_column(
        "properties",
        "images",
        existing_type=sa.JSON(),
        type_=postgresql.JSONB(),
        existing_nullable=True,
        postgresql_using="images::jsonb",
    )


def downgrade() -> None:
    op.alter_column(
        "properties",
        "images",
        existing_type=postgresql.JSONB(),
        type_=sa.JSON(),
        existing_nullable=True,
        postgresql_using="images::json",
    )
    op.alter_column(
        "landing_pages",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        existing_server_default=sa.func.now(),
        nullable=True,
    )
    op.alter_column(
        "landing_pages",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        existing_server_default=sa.func.now(),
        nullable=True,
    )
