"""Localized photo descriptions are project content, keyed by stable media URL."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '20260908_0022'
down_revision = '20260908_0021'
branch_labels = None
depends_on = None


def upgrade():
    for table in ('properties', 'news_articles'):
        op.add_column(table, sa.Column('image_details', JSONB(), nullable=False, server_default='{}'))


def downgrade():
    for table in ('properties', 'news_articles'):
        op.drop_column(table, 'image_details')
