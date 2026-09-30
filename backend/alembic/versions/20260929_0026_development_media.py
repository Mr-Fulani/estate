"""Add project and residence media fields."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260929_0026"
down_revision = "20260910_0025"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("property_unit_types", sa.Column("media_images", postgresql.JSONB(), nullable=False, server_default="[]"))
    op.add_column("property_unit_types", sa.Column("video_url", sa.String(length=2000), nullable=True))


def downgrade():
    op.drop_column("property_unit_types", "video_url")
    op.drop_column("property_unit_types", "media_images")
