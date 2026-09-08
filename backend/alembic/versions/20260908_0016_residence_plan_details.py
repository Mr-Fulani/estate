"""Support on-request residence types and verified per-plan areas."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260908_0016"
down_revision = "20260908_0015"
branch_labels = None
depends_on = None


def upgrade():
    for prefix, kind in [("area", sa.Float()), ("price", sa.Numeric(12, 2))]:
        for bound in ["min", "max"]:
            op.alter_column("property_unit_types", f"{prefix}_{bound}", existing_type=kind, nullable=True)
        op.drop_constraint(f"ck_unit_{prefix}_range", "property_unit_types", type_="check")
        op.create_check_constraint(f"ck_unit_{prefix}_range", "property_unit_types",
            f"({prefix}_min IS NULL AND {prefix}_max IS NULL) OR "
            f"({prefix}_min IS NOT NULL AND {prefix}_max IS NOT NULL AND {prefix}_min > 0 AND {prefix}_max >= {prefix}_min)")
    op.add_column("property_unit_types", sa.Column("plan_details", postgresql.JSONB(), nullable=False, server_default="[]"))


def downgrade():
    # Fail rather than silently replace unknown figures with invented values.
    op.execute("DO $$ BEGIN IF EXISTS (SELECT 1 FROM property_unit_types WHERE area_min IS NULL OR price_min IS NULL) THEN RAISE EXCEPTION 'Resolve on-request areas/prices before downgrading'; END IF; END $$;")
    op.drop_column("property_unit_types", "plan_details")
    for prefix, kind in [("area", sa.Float()), ("price", sa.Numeric(12, 2))]:
        op.drop_constraint(f"ck_unit_{prefix}_range", "property_unit_types", type_="check")
        op.create_check_constraint(f"ck_unit_{prefix}_range", "property_unit_types", f"{prefix}_min > 0 AND {prefix}_max >= {prefix}_min")
        for bound in ["min", "max"]:
            op.alter_column("property_unit_types", f"{prefix}_{bound}", existing_type=kind, nullable=False)
