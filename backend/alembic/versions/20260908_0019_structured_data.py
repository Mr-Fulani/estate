"""Explicit semantic types, without guessing from slugs or names."""
from alembic import op
import sqlalchemy as sa

revision = '20260908_0019'
down_revision = '20260908_0018'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('categories', sa.Column('schema_type', sa.String(32), nullable=False, server_default='Place'))
    op.add_column('news_articles', sa.Column('author_type', sa.String(20), nullable=False, server_default='Organization'))
    op.add_column('news_articles', sa.Column('author_url', sa.String(1000), nullable=True))


def downgrade():
    op.drop_column('news_articles', 'author_url')
    op.drop_column('news_articles', 'author_type')
    op.drop_column('categories', 'schema_type')
