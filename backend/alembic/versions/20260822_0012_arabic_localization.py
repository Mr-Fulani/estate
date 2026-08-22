"""Add translatable categories, site settings and property badges.

Revision ID: 20260822_0012
Revises: 20260822_0011
Create Date: 2026-08-22
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260822_0012"
down_revision: str | None = "20260822_0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "property_translations",
        sa.Column("status_badge", sa.String(length=100), nullable=True),
    )

    op.create_table(
        "category_translations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("locale", sa.String(length=2), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("category_id", "locale", name="uq_category_translation_locale"),
    )
    op.create_index("ix_category_translations_category_id", "category_translations", ["category_id"])
    op.create_index("ix_category_translations_locale", "category_translations", ["locale"])
    op.execute(
        sa.text(
            """
            INSERT INTO category_translations (category_id, locale, name, description)
            SELECT id, 'ru', name, description
            FROM categories
            """
        )
    )

    op.create_table(
        "site_setting_translations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("setting_id", sa.Integer(), nullable=False),
        sa.Column("locale", sa.String(length=2), nullable=False),
        sa.Column("address", sa.String(length=300), nullable=False),
        sa.Column("working_hours", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["setting_id"], ["site_settings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("setting_id", "locale", name="uq_site_setting_translation_locale"),
    )
    op.create_index("ix_site_setting_translations_setting_id", "site_setting_translations", ["setting_id"])
    op.create_index("ix_site_setting_translations_locale", "site_setting_translations", ["locale"])
    op.execute(
        sa.text(
            """
            INSERT INTO site_setting_translations (setting_id, locale, address, working_hours)
            SELECT id, 'ru', address, working_hours
            FROM site_settings
            """
        )
    )


def downgrade() -> None:
    op.drop_index("ix_site_setting_translations_locale", table_name="site_setting_translations")
    op.drop_index("ix_site_setting_translations_setting_id", table_name="site_setting_translations")
    op.drop_table("site_setting_translations")
    op.drop_index("ix_category_translations_locale", table_name="category_translations")
    op.drop_index("ix_category_translations_category_id", table_name="category_translations")
    op.drop_table("category_translations")
    op.drop_column("property_translations", "status_badge")
