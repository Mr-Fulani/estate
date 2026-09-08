import unittest
from pydantic import ValidationError
from app.schemas.contact import ContactCreate, ContactTrackCreate


class AttributionTests(unittest.TestCase):
    def test_separate_touches_are_json_serializable_and_strip_private_urls(self):
        touch = {'at': '2026-09-08T12:00:00Z', 'page_url': 'https://agency.test/en?token=secret', 'referrer': 'https://search.test/?q=private', 'utm_source': 'search'}
        contact = ContactCreate(name='Test person', phone='123456789', message='Test enquiry', first_touch=touch, last_touch=touch, page_url='https://agency.test/en/home?preview=secret')
        import json
        payload = contact.model_dump(mode='json')
        self.assertNotIn('secret', json.dumps(payload))
        self.assertNotIn('private', json.dumps(payload))
        self.assertEqual(payload['kind'], 'form')
        self.assertEqual(ContactTrackCreate(channel='phone').kind, 'click')
        with self.assertRaises(ValidationError):
            ContactCreate(name='Test person', phone='123456789', message='Test enquiry', first_touch={**touch, 'page_url': 'javascript:alert(1)'})


class PublicLanguageTests(unittest.TestCase):
    def test_news_cannot_fall_back_to_a_disabled_project_language(self):
        from unittest.mock import patch
        from app.api.news import _public_article
        from app.models.news import NewsArticle, NewsTranslation
        from fastapi import HTTPException
        article = NewsArticle(translations=[NewsTranslation(locale='ru', title='Title', excerpt='Excerpt', content='Text')])
        with patch('app.api.news.site_runtime', return_value={'locales':['en','tr'],'default_locale':'en'}):
            with self.assertRaises(HTTPException) as failure:
                _public_article(article, 'en')
            self.assertEqual(failure.exception.status_code, 404)
