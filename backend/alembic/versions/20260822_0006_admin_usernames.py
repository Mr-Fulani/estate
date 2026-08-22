"""Add unique usernames for administrator login.

Revision ID: 20260822_0006
Revises: 20260822_0005
Create Date: 2026-08-22
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260822_0006"
down_revision: str | None = "20260822_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("admin_users", sa.Column("username", sa.String(length=80), nullable=True))
    op.execute(sa.text("UPDATE admin_users SET username = 'admin_' || id::text"))
    op.alter_column("admin_users", "username", nullable=False)
    op.create_unique_constraint("uq_admin_users_username", "admin_users", ["username"])
    op.create_index("ix_admin_users_username", "admin_users", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_admin_users_username", table_name="admin_users")
    op.drop_constraint("uq_admin_users_username", "admin_users", type_="unique")
    op.drop_column("admin_users", "username")
