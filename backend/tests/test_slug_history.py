import unittest
from pydantic import ValidationError
from app.schemas.property import PropertyUpdate
from app.schemas.news import NewsArticleUpdate
from app.utils.slug import generate_slug


class SlugValidationTests(unittest.TestCase):
    def test_invalid_slugs_are_rejected_by_both_edit_apis(self):
        for value in ['', '123', 'admin', 'featured', 'a/b', 'a?token=x', 'UPPER', 'a--b', None]:
            for model in (PropertyUpdate, NewsArticleUpdate):
                with self.assertRaises(ValidationError):
                    model(slug=value)
        self.assertEqual(PropertyUpdate(slug='office-lisbon').slug, 'office-lisbon')
        self.assertEqual(PropertyUpdate(title='Changed title').model_dump(exclude_unset=True), {'title':'Changed title'})

    def test_auto_slug_from_long_title_fits_public_url_contract(self):
        value = generate_slug('Long property title ' * 50)
        self.assertLessEqual(len(value),220)
        self.assertEqual(PropertyUpdate(slug=value).slug,value)
