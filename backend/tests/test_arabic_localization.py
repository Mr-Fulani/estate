import unittest

from pydantic import ValidationError

from app.schemas.category import CategoryTranslationInput
from app.schemas.contact import ContactCreate
from app.schemas.news import NewsTranslationBase
from app.schemas.property import PropertyTranslationInput
from app.schemas.review import ReviewPublicCreate
from app.schemas.settings import SiteSettingsTranslationInput


class ArabicLocalizationSchemaTests(unittest.TestCase):
    def test_arabic_is_accepted_across_localized_public_content(self):
        self.assertEqual(
            PropertyTranslationInput(
                locale="ar",
                title="شقة بإطلالة بحرية",
                status_badge="متاح",
            ).locale,
            "ar",
        )
        self.assertEqual(
            NewsTranslationBase(
                locale="ar",
                title="دليل شراء العقارات",
                excerpt="خطوات عملية قبل الشراء",
                content="تحقق من المستندات والتكاليف قبل دفع العربون.",
            ).locale,
            "ar",
        )
        self.assertEqual(
            ReviewPublicCreate(
                reviewer_name="أحمد",
                phone="+90 555 000 00 00",
                rating=5,
                locale="ar",
                content="كانت عملية الشراء واضحة ومنظمة من البداية.",
                consent_given=True,
            ).locale,
            "ar",
        )
        self.assertEqual(
            ContactCreate(
                name="أحمد",
                phone="+90 555 000 00 00",
                message="أرغب في معرفة المزيد عن هذا العقار.",
                locale="ar",
            ).locale,
            "ar",
        )

    def test_arabic_is_accepted_for_reference_data(self):
        self.assertEqual(
            CategoryTranslationInput(locale="ar", name="فيلا").name,
            "فيلا",
        )
        settings = SiteSettingsTranslationInput(
            locale="ar",
            address="إسطنبول، بيليك دوزو",
            working_hours="يومياً من 9:00 إلى 21:00",
        )
        self.assertEqual(settings.locale, "ar")

    def test_unknown_locale_is_rejected(self):
        with self.assertRaises(ValidationError):
            PropertyTranslationInput(locale="de", title="Wohnung")


if __name__ == "__main__":
    unittest.main()
