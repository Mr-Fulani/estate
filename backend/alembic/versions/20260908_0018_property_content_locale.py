"""Record the language of base property fields, preserving existing Russian records."""
from alembic import op
import sqlalchemy as sa

revision = '20260908_0018'
down_revision = '20260908_0017'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('properties', sa.Column('content_locale', sa.String(2), nullable=False, server_default='ru'))
    op.alter_column('properties', 'content_locale', server_default=None)


def downgrade():
    op.drop_column('properties', 'content_locale')
