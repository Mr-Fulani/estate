"""Add persistent public rate limits and hash invitation tokens.

Revision ID: 20260822_0011
Revises: 20260822_0010
Create Date: 2026-08-22
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260822_0011"
down_revision: str | None = "20260822_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "public_rate_limits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key_hash", sa.String(length=64), nullable=False),
        sa.Column("action", sa.String(length=40), nullable=False),
        sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("request_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key_hash", "action", name="uq_public_rate_limit_key_action"),
    )
    op.create_index("ix_public_rate_limits_key_hash", "public_rate_limits", ["key_hash"])
    op.create_index("ix_public_rate_limits_action", "public_rate_limits", ["action"])

    op.add_column(
        "lead_activities",
        sa.Column("external_message_id", sa.String(length=200), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE lead_activities
            SET external_message_id = event_data ->> 'external_message_id'
            WHERE event_type = 'messenger_message'
              AND event_data ->> 'external_message_id' IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            WITH duplicates AS (
                SELECT id,
                       row_number() OVER (
                           PARTITION BY event_type, external_message_id ORDER BY id
                       ) AS duplicate_number
                FROM lead_activities
                WHERE external_message_id IS NOT NULL
            )
            UPDATE lead_activities AS activity
            SET external_message_id = NULL
            FROM duplicates
            WHERE activity.id = duplicates.id
              AND duplicates.duplicate_number > 1
            """
        )
    )
    op.create_index(
        "uq_lead_activities_external_message",
        "lead_activities",
        ["event_type", "external_message_id"],
        unique=True,
        postgresql_where=sa.text("external_message_id IS NOT NULL"),
    )

    op.drop_index("ix_reviews_invitation_token", table_name="reviews")
    op.alter_column(
        "reviews",
        "invitation_token",
        new_column_name="invitation_token_hash",
        existing_type=sa.String(length=100),
        type_=sa.String(length=64),
        existing_nullable=True,
    )
    op.execute(
        sa.text(
            """
            UPDATE reviews
            SET invitation_token_hash = encode(
                sha256(convert_to(invitation_token_hash, 'UTF8')),
                'hex'
            )
            WHERE invitation_token_hash IS NOT NULL
            """
        )
    )
    op.create_index(
        "ix_reviews_invitation_token_hash",
        "reviews",
        ["invitation_token_hash"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_reviews_invitation_token_hash", table_name="reviews")
    op.alter_column(
        "reviews",
        "invitation_token_hash",
        new_column_name="invitation_token",
        existing_type=sa.String(length=64),
        type_=sa.String(length=100),
        existing_nullable=True,
    )
    op.create_index(
        "ix_reviews_invitation_token",
        "reviews",
        ["invitation_token"],
        unique=True,
    )

    op.drop_index("uq_lead_activities_external_message", table_name="lead_activities")
    op.drop_column("lead_activities", "external_message_id")
    op.drop_index("ix_public_rate_limits_action", table_name="public_rate_limits")
    op.drop_index("ix_public_rate_limits_key_hash", table_name="public_rate_limits")
    op.drop_table("public_rate_limits")
