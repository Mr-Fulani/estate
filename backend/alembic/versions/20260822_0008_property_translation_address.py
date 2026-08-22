"""Add localized property address fields.

Revision ID: 20260822_0008
Revises: 20260822_0007
Create Date: 2026-08-22
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260822_0008"
down_revision: str | None = "20260822_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("property_translations", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("property_translations", sa.Column("district", sa.String(length=100), nullable=True))
    op.add_column("property_translations", sa.Column("address", sa.String(length=300), nullable=True))
    op.execute(
        sa.text(
            """
            UPDATE property_translations AS translation
            SET city = property.city,
                district = property.district,
                address = property.address
            FROM properties AS property
            WHERE translation.property_id = property.id
              AND translation.locale = 'ru'
            """
        )
    )


def downgrade() -> None:
    op.drop_column("property_translations", "address")
    op.drop_column("property_translations", "district")
    op.drop_column("property_translations", "city")
