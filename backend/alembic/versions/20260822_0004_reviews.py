"""Add moderated multilingual customer reviews.

Revision ID: 20260822_0004
Revises: 20260822_0003
Create Date: 2026-08-22
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260822_0004"
down_revision: str | None = "20260822_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reviewer_name", sa.String(length=100), nullable=True),
        sa.Column("email", sa.String(length=200), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("source_locale", sa.String(length=2), server_default="ru", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("consent_given", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=True),
        sa.Column("contact_id", sa.Integer(), nullable=True),
        sa.Column("invitation_token", sa.String(length=100), nullable=True),
        sa.Column("invitation_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["contact_id"], ["contact_requests.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reviews_id", "reviews", ["id"])
    op.create_index("ix_reviews_source_locale", "reviews", ["source_locale"])
    op.create_index("ix_reviews_status", "reviews", ["status"])
    op.create_index("ix_reviews_is_verified", "reviews", ["is_verified"])
    op.create_index("ix_reviews_is_featured", "reviews", ["is_featured"])
    op.create_index("ix_reviews_property_id", "reviews", ["property_id"])
    op.create_index("ix_reviews_contact_id", "reviews", ["contact_id"], unique=True)
    op.create_index("ix_reviews_invitation_token", "reviews", ["invitation_token"], unique=True)
    op.create_index("ix_reviews_published_at", "reviews", ["published_at"])

    op.create_table(
        "review_translations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("review_id", sa.Integer(), nullable=False),
        sa.Column("locale", sa.String(length=2), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("reviewer_role", sa.String(length=160), nullable=True),
        sa.Column("company_response", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("review_id", "locale", name="uq_review_translation_locale"),
    )
    op.create_index("ix_review_translations_review_id", "review_translations", ["review_id"])
    op.create_index("ix_review_translations_locale", "review_translations", ["locale"])


def downgrade() -> None:
    op.drop_index("ix_review_translations_locale", table_name="review_translations")
    op.drop_index("ix_review_translations_review_id", table_name="review_translations")
    op.drop_table("review_translations")
    op.drop_index("ix_reviews_published_at", table_name="reviews")
    op.drop_index("ix_reviews_invitation_token", table_name="reviews")
    op.drop_index("ix_reviews_contact_id", table_name="reviews")
    op.drop_index("ix_reviews_property_id", table_name="reviews")
    op.drop_index("ix_reviews_is_featured", table_name="reviews")
    op.drop_index("ix_reviews_is_verified", table_name="reviews")
    op.drop_index("ix_reviews_status", table_name="reviews")
    op.drop_index("ix_reviews_source_locale", table_name="reviews")
    op.drop_index("ix_reviews_id", table_name="reviews")
    op.drop_table("reviews")
