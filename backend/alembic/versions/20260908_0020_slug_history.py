"""Permanent URL aliases point to identities, avoiding redirect chains."""
from alembic import op
import sqlalchemy as sa

revision = '20260908_0020'
down_revision = '20260908_0019'
branch_labels = None
depends_on = None


def upgrade():
    for table, target in [('property_slug_aliases','properties'),('news_slug_aliases','news_articles')]:
        op.create_table(table, sa.Column('slug',sa.String(255),primary_key=True),sa.Column('resource_id',sa.Integer(),sa.ForeignKey(f'{target}.id',ondelete='CASCADE'),nullable=False))
        op.create_index(f'ix_{table}_resource_id',table,['resource_id'])


def downgrade():
    op.drop_table('news_slug_aliases')
    op.drop_table('property_slug_aliases')
