"""Neutral template upgrades; historical client data migrations are not replayed."""
import asyncio
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import get_settings

# The only schema effect in this historical client migration was an author default.
# Revision 0023 installs the neutral default for both old and new databases.
CLIENT_DATA_REVISION = '20260823_0013'


def migrate_connection(connection):
    root = Path(__file__).resolve().parents[1]
    config = Config(str(root / 'alembic.ini'))
    config.set_main_option('script_location', str(root / 'alembic'))
    config.attributes['connection'] = connection
    script = ScriptDirectory.from_config(config)
    revisions = list(reversed(list(script.walk_revisions())))
    revision_ids = [revision.revision for revision in revisions]
    if len(script.get_heads()) != 1:
        raise RuntimeError('Neutral migration runner requires a linear migration history')
    for previous, following in zip(revisions, revisions[1:]):
        if following.down_revision != previous.revision:
            raise RuntimeError('Review branched migrations before running this upgrade')
    heads = MigrationContext.configure(connection).get_current_heads()
    if len(heads) > 1:
        raise RuntimeError('Multiple database revisions require an explicit merge')
    current = heads[0] if heads else None
    if current is None and set(inspect(connection).get_table_names()) - {'alembic_version'}:
        raise RuntimeError('Unversioned non-empty database: verify its schema and stamp the matching revision first')
    current_index = revision_ids.index(current) if current else -1
    client_index = revision_ids.index(CLIENT_DATA_REVISION)
    if current_index < client_index:
        command.upgrade(config, revisions[client_index].down_revision)
        command.stamp(config, CLIENT_DATA_REVISION)
    command.upgrade(config, 'head')


async def migrate():
    engine = create_async_engine(get_settings().DATABASE_URL)
    try:
        async with engine.begin() as connection:
            # One transaction and one lock cover all intermediate upgrades/stamps.
            await connection.execute(text("SELECT pg_advisory_xact_lock(hashtextextended('estate-schema-upgrade', 0))"))
            await connection.run_sync(migrate_connection)
    finally:
        await engine.dispose()


if __name__ == '__main__':
    asyncio.run(migrate())
