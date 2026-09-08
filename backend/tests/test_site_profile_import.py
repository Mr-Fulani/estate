import json
from pathlib import Path
import unittest

from app.services.site_profile_import import fill_missing_profile


class SiteProfileImportTests(unittest.TestCase):
    def setUp(self):
        self.profile = json.loads((Path(__file__).resolve().parents[1] / 'project_profiles' / 'rahat-home.json').read_text())

    def test_restore_project_identity_and_media(self):
        restored = fill_missing_profile({}, self.profile)
        self.assertEqual(restored['brand_name'], 'Rahat Home')
        self.assertIn('photo-1600596542815', restored['hero_image_url'])
        self.assertIn('photo-1560518883', restored['about_image_url'])
        self.assertEqual(restored['og_image_url'], '/og.png')
        self.assertEqual(set(restored['seo']), {'ru', 'en', 'tr', 'ar'})
        self.assertFalse(restored['content_reviewed'])

    def test_repeated_import_preserves_cms_edits(self):
        current = {'brand_name': 'Rahat Home', 'hero_image_url': '/uploads/new-hero.webp', 'content_reviewed': False,
                   'seo': {'ru': {'home': {'title': 'Редакторский заголовок', 'description': 'Своё описание'}}}}
        restored = fill_missing_profile(current, self.profile)
        self.assertEqual(restored['hero_image_url'], '/uploads/new-hero.webp')
        self.assertEqual(restored['seo']['ru']['home']['title'], 'Редакторский заголовок')
        self.assertEqual(fill_missing_profile(restored, self.profile), restored)
        self.assertNotIn('about_image_url', current)

    def test_rejects_import_into_another_company(self):
        with self.assertRaisesRegex(ValueError, 'another company'):
            fill_missing_profile({'brand_name': 'Agency Beta'}, self.profile)
