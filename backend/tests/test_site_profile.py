import unittest
from pydantic import ValidationError
from app.schemas.site_profile import SiteProfile


class SiteProfileTests(unittest.TestCase):
    def test_neutral_installation_and_asset_validation(self):
        self.assertEqual(SiteProfile().brand_name, '')
        for value in ['javascript:alert(1)', '//foreign.com/a.png', 'https://u:p@agency.com/a.png', '/\\evil.com/a.png']:
            with self.assertRaises(ValidationError):
                SiteProfile(logo_url=value)
        self.assertEqual(SiteProfile(logo_url='/uploads/logo.png').logo_url, '/uploads/logo.png')

    def test_copy_is_bounded_and_does_not_accept_prototype_paths(self):
        with self.assertRaises(ValidationError):
            SiteProfile(copy={'en': {'__proto__.x': 'y'}})
        with self.assertRaises(ValidationError):
            SiteProfile(seo={'en': {'unknown': {'title': 'x'}}})
