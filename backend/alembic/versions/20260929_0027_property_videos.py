"""Add video media to ordinary property listings."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260929_0027"
down_revision = "20260929_0026"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("properties", sa.Column("videos", postgresql.JSONB(), nullable=False, server_default="[]"))


def downgrade():
    op.drop_column("properties", "videos")
