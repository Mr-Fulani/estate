"""Add ordered media to news articles.

Revision ID: 20260822_0009
Revises: 20260822_0008
Create Date: 2026-08-22
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260822_0009"
down_revision: str | None = "20260822_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "news_media",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("article_id", sa.Integer(), nullable=False),
        sa.Column("media_type", sa.String(length=16), nullable=False),
        sa.Column("url", sa.String(length=1000), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.CheckConstraint("media_type IN ('image', 'youtube')", name="ck_news_media_type"),
        sa.ForeignKeyConstraint(["article_id"], ["news_articles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_news_media_article_id", "news_media", ["article_id"])
    op.create_index("ix_news_media_article_position", "news_media", ["article_id", "position"])


def downgrade() -> None:
    op.drop_index("ix_news_media_article_position", table_name="news_media")
    op.drop_index("ix_news_media_article_id", table_name="news_media")
    op.drop_table("news_media")
