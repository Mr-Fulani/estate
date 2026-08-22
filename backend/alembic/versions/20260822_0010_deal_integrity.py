"""Add deal currency snapshots and property-state restoration fields.

Revision ID: 20260822_0010
Revises: 20260822_0009
Create Date: 2026-08-22
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260822_0010"
down_revision: str | None = "20260822_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "contact_requests",
        sa.Column("deal_value_rub", sa.Numeric(precision=18, scale=2), nullable=True),
    )
    op.add_column(
        "contact_requests",
        sa.Column("deal_exchange_rate", sa.Numeric(precision=18, scale=8), nullable=True),
    )
    op.add_column(
        "contact_requests",
        sa.Column("deal_rate_effective_date", sa.Date(), nullable=True),
    )
    op.add_column(
        "contact_requests",
        sa.Column("previous_property_market_status", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "contact_requests",
        sa.Column("previous_property_status_badge", sa.String(length=100), nullable=True),
    )

    op.execute(
        sa.text(
            """
            UPDATE contact_requests
            SET deal_currency = UPPER(deal_currency)
            WHERE deal_currency IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE contact_requests
            SET deal_value_rub = deal_value,
                deal_exchange_rate = 1,
                deal_rate_effective_date = COALESCE(closed_at::date, CURRENT_DATE)
            WHERE deal_currency = 'RUB' AND deal_value IS NOT NULL
            """
        )
    )
    op.create_check_constraint(
        "ck_contact_requests_deal_currency",
        "contact_requests",
        "deal_currency IN ('RUB', 'USD', 'EUR', 'TRY')",
    )
    op.create_check_constraint(
        "ck_contact_requests_deal_value_nonnegative",
        "contact_requests",
        "deal_value IS NULL OR deal_value >= 0",
    )
    op.create_check_constraint(
        "ck_contact_requests_deal_value_rub_nonnegative",
        "contact_requests",
        "deal_value_rub IS NULL OR deal_value_rub >= 0",
    )
    op.create_index(
        "uq_contact_requests_won_property",
        "contact_requests",
        ["property_id"],
        unique=True,
        postgresql_where=sa.text("status = 'won' AND property_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_contact_requests_won_property", table_name="contact_requests")
    op.drop_constraint(
        "ck_contact_requests_deal_value_rub_nonnegative",
        "contact_requests",
        type_="check",
    )
    op.drop_constraint(
        "ck_contact_requests_deal_value_nonnegative",
        "contact_requests",
        type_="check",
    )
    op.drop_constraint(
        "ck_contact_requests_deal_currency",
        "contact_requests",
        type_="check",
    )
    op.drop_column("contact_requests", "previous_property_status_badge")
    op.drop_column("contact_requests", "previous_property_market_status")
    op.drop_column("contact_requests", "deal_rate_effective_date")
    op.drop_column("contact_requests", "deal_exchange_rate")
    op.drop_column("contact_requests", "deal_value_rub")
