import unittest
from unittest.mock import patch
from pydantic import ValidationError
from app.schemas.landing_page import LandingInput


class LandingPageTests(unittest.TestCase):
    def test_drafts_are_allowed_but_publication_requires_authored_content(self):
        self.assertFalse(LandingInput(slug='city-homes').is_published)
        with self.assertRaises(ValidationError):
            LandingInput(slug='city-homes', is_published=True)
        with patch('app.schemas.landing_page.site_runtime', return_value={'default_locale':'en'}):
            page = LandingInput(slug='city-homes', is_published=True, translations={'en':{'title':'Homes','description':'Guide','content':'Authored local guide'}},filters={'transaction_type':'rent','city':'Lisbon'})
            self.assertEqual(page.filters.transaction_type,'rent')

    def test_unapproved_dynamic_query_fields_are_rejected(self):
        with self.assertRaises(ValidationError):
            LandingInput(slug='city-homes',filters={'include_inactive':True})
