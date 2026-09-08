"""Run real upgrades in isolated, transaction-rolled-back PostgreSQL schemas."""
import os
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.demo_import import require_demo_import
from app.migrate import migrate_connection


class DemoImportTests(unittest.TestCase):
    def test_demo_import_requires_explicit_nonproduction_opt_in(self):
        from types import SimpleNamespace
        for environment, enabled, allowed in [('development', False, False), ('production', True, False), ('development', True, True)]:
            with patch('app.demo_import.get_settings', return_value=SimpleNamespace(ENVIRONMENT=environment, ALLOW_DEMO_IMPORT=enabled)):
                if allowed:
                    require_demo_import()
                else:
                    with self.assertRaises(RuntimeError):
                        require_demo_import()


@unittest.skipUnless(os.getenv('SEO_TEST_DATABASE_URL'), 'Dedicated SEO database is not configured')
class NeutralMigrationTests(unittest.IsolatedAsyncioTestCase):
    async def test_fresh_legacy_and_previously_rebranded_installations(self):
        engine = create_async_engine(os.environ['SEO_TEST_DATABASE_URL'])
        try:
            for starting in [None, '20260822_0012', '20260823_0013']:
                async with engine.connect() as connection:
                    self.assertEqual(await connection.scalar(text('select current_database()')), 'estate_seo_test')
                    schema = 'seo_migration_' + uuid.uuid4().hex
                    await connection.execute(text(f'CREATE SCHEMA {schema}'))
                    await connection.execute(text(f'SET LOCAL search_path TO {schema}'))
                    def run(sync):
                        if starting:
                            cfg = Config(str(Path(__file__).resolve().parents[1] / 'alembic.ini'))
                            cfg.attributes['connection'] = sync
                            command.upgrade(cfg, starting)
                            sync.execute(text("INSERT INTO categories(name, slug) VALUES ('Estate Partner', 'legacy-partner')"))
                            sync.execute(text("INSERT INTO news_articles(slug,author) VALUES ('legacy-news','Estate Partner')"))
                        migrate_connection(sync)
                        migrate_connection(sync)
                        if starting:
                            self.assertEqual(sync.scalar(text('SELECT name FROM categories')), 'Estate Partner')
                            self.assertEqual(sync.scalar(text('SELECT author FROM news_articles')), 'Estate Partner')
                        else:
                            self.assertEqual(sync.scalar(text('SELECT count(*) FROM site_settings')), 0)
                            self.assertEqual(sync.scalar(text('SELECT count(*) FROM categories')), 0)
                        sync.execute(text("INSERT INTO news_articles(slug) VALUES ('neutral-author')"))
                        self.assertEqual(sync.scalar(text("SELECT author FROM news_articles WHERE slug='neutral-author'")), '')
                    await connection.run_sync(run)
                    await connection.rollback()
        finally:
            await engine.dispose()
