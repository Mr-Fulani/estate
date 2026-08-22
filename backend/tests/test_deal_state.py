import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import Request
from pydantic import ValidationError

from app.api.contacts import _restore_property_after_won, update_contact
from app.models.admin_user import AdminUser
from app.models.contact import ContactRequest
from app.models.property import Property
from app.schemas.contact import ContactUpdate


def property_record(*, status: str, badge: str | None) -> Property:
    return Property(
        id=10,
        title="Test property",
        slug="test-property",
        price=100,
        category_id=1,
        market_status=status,
        status_badge=badge,
    )


class DealSchemaTests(unittest.TestCase):
    def test_accepts_only_supported_deal_currencies(self):
        self.assertEqual(ContactUpdate(deal_currency="TRY").deal_currency, "TRY")
        with self.assertRaises(ValidationError):
            ContactUpdate(deal_currency="GBP")


class PropertyRestorationTests(unittest.IsolatedAsyncioTestCase):
    async def test_restores_property_state_saved_before_deal(self):
        lead = ContactRequest(
            id=1,
            property_id=10,
            status="won",
            previous_property_market_status="reserved",
            previous_property_status_badge="В брони",
        )
        item = property_record(status="sold", badge="Продано")

        with patch(
            "app.api.contacts._find_other_won_deal",
            new=AsyncMock(return_value=None),
        ):
            await _restore_property_after_won(lead, item, AsyncMock())

        self.assertEqual(item.market_status, "reserved")
        self.assertEqual(item.status_badge, "В брони")
        self.assertIsNone(lead.previous_property_market_status)
        self.assertIsNone(lead.previous_property_status_badge)

    async def test_keeps_property_closed_when_another_won_deal_exists(self):
        lead = ContactRequest(id=1, property_id=10, status="won")
        other = ContactRequest(id=2, property_id=10, status="won", outcome="rented")
        item = property_record(status="sold", badge="Продано")

        with patch(
            "app.api.contacts._find_other_won_deal",
            new=AsyncMock(return_value=other),
        ):
            await _restore_property_after_won(lead, item, AsyncMock())

        self.assertEqual(item.market_status, "rented")
        self.assertEqual(item.status_badge, "Сдано")


class DealTransitionTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.request = Request(
            {
                "type": "http",
                "method": "PATCH",
                "path": "/api/v1/contacts/1",
                "headers": [],
                "client": ("127.0.0.1", 12345),
            }
        )
        self.user = AdminUser(id=1, username="founder", email="founder@example.com", full_name="Founder", role="founder", password_hash="test")

    async def test_closing_deal_saves_rate_and_previous_property_state(self):
        lead = ContactRequest(
            id=1,
            property_id=10,
            status="negotiation",
            deal_currency="RUB",
            is_read=False,
        )
        item = property_record(status="reserved", badge="В брони")
        db = MagicMock()
        db.commit = AsyncMock()

        with (
            patch("app.api.contacts._get_lead", new=AsyncMock(side_effect=[lead, lead, lead])),
            patch("app.api.contacts._lock_property", new=AsyncMock(return_value=item)),
            patch("app.api.contacts._find_other_won_deal", new=AsyncMock(return_value=None)),
            patch("app.api.contacts._deal_conversion", new=AsyncMock(return_value=(100000.0, 1.0, None))),
        ):
            updated = await update_contact(
                1,
                ContactUpdate(status="won", outcome="sold", deal_value=100000, deal_currency="RUB"),
                self.request,
                self.user,
                db,
            )

        self.assertIs(updated, lead)
        self.assertEqual(lead.status, "won")
        self.assertEqual(lead.outcome, "sold")
        self.assertEqual(lead.deal_value_rub, 100000.0)
        self.assertEqual(lead.previous_property_market_status, "reserved")
        self.assertEqual(lead.previous_property_status_badge, "В брони")
        self.assertEqual(item.market_status, "sold")
        self.assertEqual(item.status_badge, "Продано")
        db.commit.assert_awaited_once()

    async def test_reopening_won_deal_restores_property_and_clears_financial_result(self):
        lead = ContactRequest(
            id=1,
            property_id=10,
            status="won",
            outcome="rented",
            deal_value=5000,
            deal_currency="USD",
            deal_value_rub=400000,
            deal_exchange_rate=80,
            previous_property_market_status="available",
            previous_property_status_badge="Актуально",
            is_read=True,
        )
        item = property_record(status="rented", badge="Сдано")
        db = MagicMock()
        db.commit = AsyncMock()

        with (
            patch("app.api.contacts._get_lead", new=AsyncMock(side_effect=[lead, lead, lead])),
            patch("app.api.contacts._lock_property", new=AsyncMock(return_value=item)),
            patch("app.api.contacts._find_other_won_deal", new=AsyncMock(return_value=None)),
        ):
            updated = await update_contact(
                1,
                ContactUpdate(status="negotiation"),
                self.request,
                self.user,
                db,
            )

        self.assertIs(updated, lead)
        self.assertEqual(lead.status, "negotiation")
        self.assertIsNone(lead.outcome)
        self.assertIsNone(lead.deal_value)
        self.assertIsNone(lead.deal_value_rub)
        self.assertIsNone(lead.deal_exchange_rate)
        self.assertEqual(item.market_status, "available")
        self.assertEqual(item.status_badge, "Актуально")
        db.commit.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
