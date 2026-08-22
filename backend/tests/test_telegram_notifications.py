import unittest

from pydantic import ValidationError

from app.config import Settings
from app.schemas.telegram import TelegramPreferencesUpdate
from app.telegram_notifications import new_lead_message, new_review_message


class TelegramPreferencesTests(unittest.TestCase):
    def test_requires_at_least_one_preference(self):
        with self.assertRaises(ValidationError):
            TelegramPreferencesUpdate()

    def test_accepts_explicit_false_value(self):
        payload = TelegramPreferencesUpdate(notifications_enabled=False)

        self.assertEqual(
            payload.model_dump(exclude_unset=True),
            {"notifications_enabled": False},
        )


class TelegramConfigurationTests(unittest.TestCase):
    def test_rejects_partial_bot_configuration(self):
        with self.assertRaises(ValidationError):
            Settings(
                DATABASE_URL="postgresql+asyncpg://test:test@localhost/test",
                TELEGRAM_BOT_TOKEN="token",
            )

    def test_rejects_invalid_webhook_secret_characters(self):
        with self.assertRaises(ValidationError):
            Settings(
                DATABASE_URL="postgresql+asyncpg://test:test@localhost/test",
                TELEGRAM_BOT_TOKEN="token",
                TELEGRAM_BOT_USERNAME="test_bot",
                TELEGRAM_WEBHOOK_SECRET="contains spaces",
            )


class TelegramMessageTests(unittest.TestCase):
    def test_escapes_contact_content_for_telegram_html(self):
        text = new_lead_message(
            lead_id=7,
            name="<Client>",
            phone="+90 & 555",
            email=None,
            message="Need <b>home</b>",
        )

        self.assertIn("&lt;Client&gt;", text)
        self.assertIn("+90 &amp; 555", text)
        self.assertIn("Need &lt;b&gt;home&lt;/b&gt;", text)
        self.assertNotIn("Need <b>home</b>", text)

    def test_escapes_review_content_for_telegram_html(self):
        text = new_review_message(
            review_id=3,
            reviewer_name="A & B",
            rating=5,
            content="Great <script>",
            verified=False,
        )

        self.assertIn("A &amp; B", text)
        self.assertIn("Great &lt;script&gt;", text)


if __name__ == "__main__":
    unittest.main()
