"""Curated, authored SEO landing pages, published explicitly."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '20260908_0021'
down_revision = '20260908_0020'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('landing_pages',sa.Column('id',sa.Integer(),primary_key=True),sa.Column('slug',sa.String(220),unique=True,nullable=False),sa.Column('is_published',sa.Boolean(),nullable=False,server_default=sa.false()),sa.Column('filters',JSONB(),nullable=False,server_default='{}'),sa.Column('translations',JSONB(),nullable=False,server_default='{}'),sa.Column('created_at',sa.DateTime(timezone=True),server_default=sa.func.now()),sa.Column('updated_at',sa.DateTime(timezone=True),server_default=sa.func.now()))


def downgrade():
    op.drop_table('landing_pages')
