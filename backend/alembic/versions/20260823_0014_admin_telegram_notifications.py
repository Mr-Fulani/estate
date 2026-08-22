"""Add Telegram binding and notification preferences for administrators.

Revision ID: 20260823_0014
Revises: 20260823_0013
Create Date: 2026-08-23
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260823_0014"
down_revision: str | None = "20260823_0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("admin_users", sa.Column("telegram_chat_id", sa.BigInteger(), nullable=True))
    op.add_column("admin_users", sa.Column("telegram_username", sa.String(length=80), nullable=True))
    op.add_column("admin_users", sa.Column("telegram_link_token_hash", sa.String(length=64), nullable=True))
    op.add_column("admin_users", sa.Column("telegram_link_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("admin_users", sa.Column("telegram_linked_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "admin_users",
        sa.Column(
            "telegram_notifications_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "admin_users",
        sa.Column(
            "telegram_notify_new_leads",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "admin_users",
        sa.Column(
            "telegram_notify_new_reviews",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.create_index(
        "uq_admin_users_telegram_chat_id",
        "admin_users",
        ["telegram_chat_id"],
        unique=True,
    )
    op.create_index(
        "uq_admin_users_telegram_link_token_hash",
        "admin_users",
        ["telegram_link_token_hash"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_admin_users_telegram_link_token_hash", table_name="admin_users")
    op.drop_index("uq_admin_users_telegram_chat_id", table_name="admin_users")
    op.drop_column("admin_users", "telegram_notify_new_reviews")
    op.drop_column("admin_users", "telegram_notify_new_leads")
    op.drop_column("admin_users", "telegram_notifications_enabled")
    op.drop_column("admin_users", "telegram_linked_at")
    op.drop_column("admin_users", "telegram_link_expires_at")
    op.drop_column("admin_users", "telegram_link_token_hash")
    op.drop_column("admin_users", "telegram_username")
    op.drop_column("admin_users", "telegram_chat_id")
