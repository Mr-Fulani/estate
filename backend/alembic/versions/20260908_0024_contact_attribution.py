"""Preserve first and last acquisition touch separately from conversion page."""
from alembic import op
import sqlalchemy as sa

revision = '20260908_0024'
down_revision = '20260908_0023'
branch_labels = None
depends_on = None


def upgrade():
    for name in ('first_touch', 'last_touch'):
        op.add_column('contact_requests', sa.Column(name, sa.JSON(), nullable=True))


def downgrade():
    for name in ('first_touch', 'last_touch'):
        op.drop_column('contact_requests', name)
