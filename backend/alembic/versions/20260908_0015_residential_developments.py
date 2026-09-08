"""Residential developments and their apartment types."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260908_0015"
down_revision = "20260823_0014"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("properties", sa.Column("listing_kind", sa.String(20), nullable=False, server_default="property"))
    op.add_column("properties", sa.Column("development", postgresql.JSONB(), nullable=True))
    op.create_table(
        "property_unit_types",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("code", sa.String(40), nullable=False),
        sa.Column("rooms", sa.Integer(), nullable=False),
        sa.Column("area_min", sa.Float(), nullable=False),
        sa.Column("area_max", sa.Float(), nullable=False),
        sa.Column("price_min", sa.Numeric(12, 2), nullable=False),
        sa.Column("price_max", sa.Numeric(12, 2), nullable=False),
        sa.Column("plans", postgresql.JSONB(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.UniqueConstraint("property_id", "code", name="uq_property_unit_code"),
        sa.CheckConstraint("area_min > 0 AND area_max >= area_min", name="ck_unit_area_range"),
        sa.CheckConstraint("price_min > 0 AND price_max >= price_min", name="ck_unit_price_range"),
    )
    op.create_index("ix_property_unit_types_property_id", "property_unit_types", ["property_id"])


def downgrade():
    op.drop_table("property_unit_types")
    op.drop_column("properties", "development")
    op.drop_column("properties", "listing_kind")
