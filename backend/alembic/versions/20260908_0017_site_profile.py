"""Configurable agency identity and localized SEO; no client-specific data."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20260908_0017'
down_revision = '20260908_0016'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('site_settings', sa.Column('profile', postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")))


def downgrade():
    op.drop_column('site_settings', 'profile')
