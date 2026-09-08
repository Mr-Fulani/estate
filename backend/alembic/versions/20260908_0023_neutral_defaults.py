"""Neutral SQL defaults without rewriting existing business data."""
from alembic import op
import sqlalchemy as sa

revision = '20260908_0023'
down_revision = '20260908_0022'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('news_articles', 'author', existing_type=sa.String(120), existing_nullable=False, server_default='')
    # Currency must come from a validated project setting / explicit imported data.
    op.alter_column('properties', 'currency', existing_type=sa.String(3), existing_nullable=False, server_default=None)


def downgrade():
    # Do not restore a client's brand or guess a project currency on downgrade.
    op.alter_column('news_articles', 'author', existing_type=sa.String(120), existing_nullable=False, server_default=None)
