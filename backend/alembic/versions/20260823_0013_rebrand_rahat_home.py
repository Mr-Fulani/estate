"""Replace the public Estate brand with Rahat Home.

Revision ID: 20260823_0013
Revises: 20260822_0012
Create Date: 2026-08-23
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260823_0013"
down_revision: str | None = "20260822_0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


BRANDED_COLUMNS: dict[str, tuple[str, ...]] = {
    "properties": (
        "title",
        "description",
        "address",
        "city",
        "district",
        "status_badge",
    ),
    "property_translations": (
        "title",
        "description",
        "city",
        "district",
        "address",
        "meta_title",
        "meta_description",
        "status_badge",
    ),
    "categories": ("name", "description"),
    "category_translations": ("name", "description"),
    "news_articles": ("author",),
    "news_translations": (
        "title",
        "excerpt",
        "content",
        "meta_title",
        "meta_description",
    ),
    "review_translations": ("content", "reviewer_role", "company_response"),
}


def _replace_brand(old_brand: str, new_brand: str) -> None:
    connection = op.get_bind()
    for table_name, columns in BRANDED_COLUMNS.items():
        for column_name in columns:
            connection.execute(
                sa.text(
                    f"""
                    UPDATE {table_name}
                    SET {column_name} = replace({column_name}, :old_brand, :new_brand)
                    WHERE {column_name} LIKE :brand_pattern
                    """
                ),
                {
                    "old_brand": old_brand,
                    "new_brand": new_brand,
                    "brand_pattern": f"%{old_brand}%",
                },
            )


def _replace_default_contacts(reverse: bool = False) -> None:
    old_values = {
        "email": "support@estate-agency.ru",
        "telegram": "https://t.me/estate_agency",
        "youtube": "https://youtube.com/@estate_agency",
        "instagram": "https://instagram.com/estate_agency",
    }
    new_values = {
        "email": "support@rahathome.com",
        "telegram": "https://t.me/rahat_home",
        "youtube": "https://youtube.com/@rahat_home",
        "instagram": "https://instagram.com/rahat_home",
    }
    if reverse:
        old_values, new_values = new_values, old_values

    connection = op.get_bind()
    for column_name, old_value in old_values.items():
        connection.execute(
            sa.text(
                f"""
                UPDATE site_settings
                SET {column_name} = :new_value
                WHERE {column_name} = :old_value
                """
            ),
            {"old_value": old_value, "new_value": new_values[column_name]},
        )


def upgrade() -> None:
    _replace_brand("Estate", "Rahat Home")
    _replace_default_contacts()
    op.alter_column(
        "news_articles",
        "author",
        existing_type=sa.String(length=120),
        existing_nullable=False,
        server_default="Rahat Home",
    )


def downgrade() -> None:
    _replace_brand("Rahat Home", "Estate")
    _replace_default_contacts(reverse=True)
    op.alter_column(
        "news_articles",
        "author",
        existing_type=sa.String(length=120),
        existing_nullable=False,
        server_default="Estate",
    )
