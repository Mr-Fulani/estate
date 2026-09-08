import unittest
from unittest.mock import patch
from pydantic import ValidationError
from app.config import Settings
from app.api.news import _validate_translations
from app.schemas.news import NewsTranslationBase
from app.schemas.property import PropertyCreate


class SiteRuntimeTests(unittest.TestCase):
    def test_configuration_accepts_en_tr_and_rejects_inconsistent_defaults(self):
        config = Settings(DATABASE_URL='postgresql+asyncpg://test/test', SITE_LOCALES='en,tr', SITE_DEFAULT_LOCALE='en', SITE_CURRENCIES='EUR,USD', SITE_DEFAULT_CURRENCY='EUR', CATALOG_CURRENCY='EUR')
        self.assertEqual(config.SITE_DEFAULT_LOCALE, 'en')
        with self.assertRaises(ValidationError):
            Settings(DATABASE_URL='postgresql+asyncpg://test/test', SITE_LOCALES='en,tr', SITE_DEFAULT_LOCALE='ru')

    def test_news_has_no_russian_requirement_for_english_project(self):
        translation = NewsTranslationBase(locale='en', title='Title', excerpt='Excerpt', content='Content')
        with patch('app.api.news.site_runtime', return_value={'default_locale':'en'}):
            _validate_translations([translation])

    def test_unknown_property_currency_is_rejected(self):
        with self.assertRaises(ValidationError):
            PropertyCreate(title='Property',price=100,currency='AED',category_id=1)
