"""Add per-property SEO and lead-to-deal tracking.

Revision ID: 20260822_0003
Revises: 20260822_0002
Create Date: 2026-08-22
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260822_0003"
down_revision: str | None = "20260822_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("transaction_type", sa.String(length=20), server_default="sale", nullable=False))
    op.add_column("properties", sa.Column("market_status", sa.String(length=20), server_default="available", nullable=False))
    op.create_index("ix_properties_transaction_type", "properties", ["transaction_type"])
    op.create_index("ix_properties_market_status", "properties", ["market_status"])

    op.add_column("property_translations", sa.Column("meta_title", sa.String(length=240), nullable=True))
    op.add_column("property_translations", sa.Column("meta_description", sa.String(length=320), nullable=True))

    op.alter_column("contact_requests", "name", existing_type=sa.String(length=100), nullable=True)
    op.alter_column("contact_requests", "message", existing_type=sa.Text(), nullable=True)
    op.add_column("contact_requests", sa.Column("kind", sa.String(length=20), server_default="form", nullable=False))
    op.add_column("contact_requests", sa.Column("channel", sa.String(length=30), server_default="form", nullable=False))
    op.add_column("contact_requests", sa.Column("source", sa.String(length=80), server_default="contact_form", nullable=False))
    op.add_column("contact_requests", sa.Column("locale", sa.String(length=2), nullable=True))
    op.add_column("contact_requests", sa.Column("page_url", sa.Text(), nullable=True))
    op.add_column("contact_requests", sa.Column("referrer", sa.Text(), nullable=True))
    op.add_column("contact_requests", sa.Column("utm_source", sa.String(length=120), nullable=True))
    op.add_column("contact_requests", sa.Column("utm_medium", sa.String(length=120), nullable=True))
    op.add_column("contact_requests", sa.Column("utm_campaign", sa.String(length=160), nullable=True))
    op.add_column("contact_requests", sa.Column("utm_content", sa.String(length=160), nullable=True))
    op.add_column("contact_requests", sa.Column("utm_term", sa.String(length=160), nullable=True))
    op.add_column("contact_requests", sa.Column("session_id", sa.String(length=100), nullable=True))
    op.add_column("contact_requests", sa.Column("external_conversation_id", sa.String(length=200), nullable=True))
    op.add_column("contact_requests", sa.Column("external_username", sa.String(length=160), nullable=True))
    op.add_column("contact_requests", sa.Column("outcome", sa.String(length=20), nullable=True))
    op.add_column("contact_requests", sa.Column("deal_value", sa.Numeric(14, 2), nullable=True))
    op.add_column("contact_requests", sa.Column("deal_currency", sa.String(length=3), server_default="RUB", nullable=False))
    op.add_column("contact_requests", sa.Column("assigned_to", sa.String(length=120), nullable=True))
    op.add_column("contact_requests", sa.Column("next_follow_up_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("contact_requests", sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("contact_requests", sa.Column("is_read", sa.Boolean(), server_default=sa.text("false"), nullable=False))
    op.add_column("contact_requests", sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True))
    op.create_index("ix_contact_requests_kind", "contact_requests", ["kind"])
    op.create_index("ix_contact_requests_channel", "contact_requests", ["channel"])
    op.create_index("ix_contact_requests_source", "contact_requests", ["source"])
    op.create_index("ix_contact_requests_session_id", "contact_requests", ["session_id"])
    op.create_index("ix_contact_requests_external_conversation_id", "contact_requests", ["external_conversation_id"])
    op.create_index("ix_contact_requests_status", "contact_requests", ["status"])
    op.create_index("ix_contact_requests_outcome", "contact_requests", ["outcome"])
    op.create_index("ix_contact_requests_is_read", "contact_requests", ["is_read"])

    op.create_table(
        "lead_activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("contact_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=40), nullable=False),
        sa.Column("from_status", sa.String(length=30), nullable=True),
        sa.Column("to_status", sa.String(length=30), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("event_data", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["contact_id"], ["contact_requests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lead_activities_id", "lead_activities", ["id"])
    op.create_index("ix_lead_activities_contact_id", "lead_activities", ["contact_id"])
    op.create_index("ix_lead_activities_event_type", "lead_activities", ["event_type"])

    op.execute(
        """
        INSERT INTO lead_activities (contact_id, event_type, to_status, event_data, created_at)
        SELECT id, 'lead_imported', status, '{\"source\": \"legacy\"}', created_at
        FROM contact_requests
        """
    )


def downgrade() -> None:
    op.drop_index("ix_lead_activities_event_type", table_name="lead_activities")
    op.drop_index("ix_lead_activities_contact_id", table_name="lead_activities")
    op.drop_index("ix_lead_activities_id", table_name="lead_activities")
    op.drop_table("lead_activities")

    for index_name in (
        "ix_contact_requests_is_read",
        "ix_contact_requests_outcome",
        "ix_contact_requests_status",
        "ix_contact_requests_external_conversation_id",
        "ix_contact_requests_session_id",
        "ix_contact_requests_source",
        "ix_contact_requests_channel",
        "ix_contact_requests_kind",
    ):
        op.drop_index(index_name, table_name="contact_requests")
    for column_name in (
        "updated_at", "is_read", "closed_at", "next_follow_up_at", "assigned_to",
        "deal_currency", "deal_value", "outcome", "external_username", "external_conversation_id",
        "session_id", "utm_term", "utm_content",
        "utm_campaign", "utm_medium", "utm_source", "referrer", "page_url", "locale",
        "source", "channel", "kind",
    ):
        op.drop_column("contact_requests", column_name)
    op.alter_column("contact_requests", "message", existing_type=sa.Text(), nullable=False)
    op.alter_column("contact_requests", "name", existing_type=sa.String(length=100), nullable=False)

    op.drop_column("property_translations", "meta_description")
    op.drop_column("property_translations", "meta_title")
    op.drop_index("ix_properties_market_status", table_name="properties")
    op.drop_index("ix_properties_transaction_type", table_name="properties")
    op.drop_column("properties", "market_status")
    op.drop_column("properties", "transaction_type")
