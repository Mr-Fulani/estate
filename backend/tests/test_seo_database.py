"""Opt-in integration tests against a dedicated, migrated test database."""
import os
import unittest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.models import Category, Property, SiteSetting
from app.schemas.settings import SiteSettingsResponse


@unittest.skipUnless(os.getenv('SEO_TEST_DATABASE_URL'), 'Dedicated SEO database is not configured')
class SeoDatabaseTests(unittest.IsolatedAsyncioTestCase):
    async def test_profile_roundtrip_and_property_language_default(self):
        engine = create_async_engine(os.environ['SEO_TEST_DATABASE_URL'])
        try:
            async with engine.connect() as connection:
                self.assertEqual(await connection.scalar(text('select current_database()')), 'estate_seo_test')
                transaction = await connection.begin_nested()
                async with AsyncSession(bind=connection, expire_on_commit=False) as db:
                    setting = SiteSetting(id=90001, profile={'brand_name':'Agency Beta', 'copy':{'en':{'about.intro':'Local team'}}}, translations=[])
                    category = Category(name='Office', slug='seo-test-office')
                    db.add_all([setting, category])
                    await db.flush()
                    prop = Property(title='Office', description='Complete description', price=100, currency='EUR', category_id=category.id, slug='seo-test-property', image_details={'/room.jpg': {'en': {'alt': 'Meeting room', 'caption': 'Second floor'}}})
                    db.add(prop)
                    await db.flush()
                    await db.refresh(prop)
                    self.assertEqual(prop.content_locale, os.getenv('SITE_DEFAULT_LOCALE', 'ru'))
                    from app.api.properties import get_property
                    from app.models.slug_alias import PropertySlugAlias
                    from app.services.slug_history import ensure_slug_available, remember_slug
                    from fastapi import HTTPException
                    for target in ['seo-test-next', 'seo-test-final']:
                        await ensure_slug_available(db, Property, PropertySlugAlias, target, prop.id)
                        await remember_slug(db, PropertySlugAlias, prop.slug, prop.id)
                        prop.slug = target
                        await db.flush()
                    resolved = await get_property('seo-test-property', db, None)
                    self.assertEqual(resolved.slug, 'seo-test-final')
                    self.assertEqual(resolved.image_details['/room.jpg']['en']['alt'], 'Meeting room')
                    with self.assertRaises(HTTPException) as conflict:
                        await ensure_slug_available(db, Property, PropertySlugAlias, 'seo-test-property')
                    self.assertEqual(conflict.exception.status_code, 409)
                    from app.api.seo import sitemap_items
                    sitemap = await sitemap_items(db, ['en','tr'])
                    entry = next(item for item in sitemap['items'] if item['path']=='/properties/seo-test-final')
                    self.assertEqual(entry['locales'], ['en'])
                    self.assertNotIn('description', entry)
                    self.assertNotIn('images', entry)
                    result = SiteSettingsResponse.model_validate(setting).model_dump(by_alias=True)
                    self.assertEqual(result['profile']['copy']['en']['about.intro'], 'Local team')
                    self.assertEqual(result['runtime']['default_locale'], os.getenv('SITE_DEFAULT_LOCALE', 'ru'))
                await transaction.rollback()
        finally:
            await engine.dispose()
