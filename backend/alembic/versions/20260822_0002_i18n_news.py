"""Add property translations and multilingual news.

Revision ID: 20260822_0002
Revises: 20260822_0001
Create Date: 2026-08-22
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260822_0002"
down_revision: str | None = "20260822_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "contact_requests",
        "email",
        existing_type=sa.String(length=200),
        nullable=True,
    )

    op.create_table(
        "news_articles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=220), nullable=False),
        sa.Column("cover_image", sa.String(length=1000), nullable=True),
        sa.Column("author", sa.String(length=120), server_default="Estate", nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_news_articles_id", "news_articles", ["id"])
    op.create_index("ix_news_articles_is_published", "news_articles", ["is_published"])
    op.create_index("ix_news_articles_published_at", "news_articles", ["published_at"])
    op.create_index("ix_news_articles_slug", "news_articles", ["slug"], unique=True)

    op.create_table(
        "news_translations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("article_id", sa.Integer(), nullable=False),
        sa.Column("locale", sa.String(length=2), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("excerpt", sa.String(length=500), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("meta_title", sa.String(length=240), nullable=True),
        sa.Column("meta_description", sa.String(length=320), nullable=True),
        sa.ForeignKeyConstraint(["article_id"], ["news_articles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("article_id", "locale", name="uq_news_translation_locale"),
    )
    op.create_index("ix_news_translations_article_id", "news_translations", ["article_id"])
    op.create_index("ix_news_translations_locale", "news_translations", ["locale"])

    op.create_table(
        "property_translations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("locale", sa.String(length=2), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("property_id", "locale", name="uq_property_translation_locale"),
    )
    op.create_index("ix_property_translations_locale", "property_translations", ["locale"])
    op.create_index("ix_property_translations_property_id", "property_translations", ["property_id"])


def downgrade() -> None:
    op.drop_index("ix_property_translations_property_id", table_name="property_translations")
    op.drop_index("ix_property_translations_locale", table_name="property_translations")
    op.drop_table("property_translations")
    op.drop_index("ix_news_translations_locale", table_name="news_translations")
    op.drop_index("ix_news_translations_article_id", table_name="news_translations")
    op.drop_table("news_translations")
    op.drop_index("ix_news_articles_slug", table_name="news_articles")
    op.drop_index("ix_news_articles_published_at", table_name="news_articles")
    op.drop_index("ix_news_articles_is_published", table_name="news_articles")
    op.drop_index("ix_news_articles_id", table_name="news_articles")
    op.drop_table("news_articles")
    op.alter_column(
        "contact_requests",
        "email",
        existing_type=sa.String(length=200),
        nullable=False,
    )
