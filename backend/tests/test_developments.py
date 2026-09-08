"""Unit checks plus opt-in PostgreSQL tests that roll back all fixture changes."""
import os
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import BackgroundTasks, HTTPException, Request
from pydantic import ValidationError
from sqlalchemy import case
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.api.contacts import _reject_demo_enquiry, create_contact, track_contact_action, update_contact
from app.api.properties import create_property, list_properties, update_property
from app.config import get_settings
from app.models.admin_user import AdminUser
from app.models.category import Category
from app.models.contact import ContactRequest
from app.models.property import Property
from app.schemas.contact import ContactCreate, ContactTrackCreate, ContactUpdate
from app.schemas.property import DevelopmentProfile, PropertyCreate, PropertyUnitTypeInput, PropertyUpdate
from app.services.developments import sync_development
from app.seed_etro import complete_layouts


def unit(code="1+1", rooms=1, minimum=100, maximum=150):
    return dict(code=code, rooms=rooms, area_min=rooms * 50, area_max=rooms * 60,
                price_min=minimum, price_max=maximum, plans=["/residences/etro/plan-1-1.webp"])


def development():
    return Property(listing_kind="development", development={}, currency="USD", unit_types=[])


class DevelopmentTests(unittest.TestCase):
    def test_demo_flag_survives_validation_and_disables_featuring(self):
        self.assertFalse(DevelopmentProfile().is_demo)
        item = development()
        item.development = {"is_demo": True}
        item.is_featured = True
        sync_development(item, [unit()])
        self.assertTrue(item.development["is_demo"])
        self.assertFalse(item.is_featured)

    def test_on_request_type_has_no_invented_price_or_area(self):
        unknown = PropertyUnitTypeInput(code="4+1", rooms=4)
        self.assertIsNone(unknown.price_min)
        self.assertIsNone(unknown.area_min)
        item = development()
        sync_development(item, [unit(), unknown.model_dump()])
        self.assertEqual(item.price, 100)
        self.assertEqual(item.area, 50)

    def test_half_known_ranges_are_rejected(self):
        for values in [dict(area_min=None), dict(price_max=None)]:
            with self.subTest(values=values), self.assertRaises(ValidationError):
                PropertyUnitTypeInput(**{**unit(), **values})

    def test_plan_area_validation_and_image_ownership(self):
        valid = dict(image=unit()["plans"][0], code="A1", area_gross=60, area_net=40, area_with_balcony=45)
        self.assertEqual(PropertyUnitTypeInput(**unit(), plan_details=[valid]).plan_details[0].area_net, 40)
        for detail in [{**valid, "area_net": 70}, {**valid, "image": "/unrelated-plan.webp"}]:
            with self.assertRaises(ValidationError):
                PropertyUnitTypeInput(**unit(), plan_details=[detail])

    def test_source_enrichment_is_idempotent_and_preserves_edits(self):
        item = development()
        item.description = "Custom description"
        item.translations = []
        sync_development(item, [unit()])
        complete_layouts(item)
        first = item.unit_types[0]
        first.plan_details = [{**first.plan_details[0], "code": "User-edited code"}]
        complete_layouts(item)
        self.assertEqual([u.code for u in item.unit_types], ["1+1", "4+1"])
        self.assertEqual(len(first.plan_details), 1)
        self.assertEqual(first.plan_details[0]["code"], "User-edited code")
        self.assertTrue(item.description.startswith("Custom description"))
        self.assertEqual(item.description.count("4+1"), 1)

    def test_ranges_must_be_ordered_finite_and_positive(self):
        for values in [dict(area_max=1), dict(price_max=1), dict(area_min=0),
                       dict(price_min=float("nan")), dict(area_max=float("inf"))]:
            with self.subTest(values=values), self.assertRaises(ValidationError):
                PropertyUnitTypeInput(**{**unit(), **values})

    def test_plan_urls_and_codes_are_validated(self):
        for value in ["javascript:alert(1)", "//example.com/plan.png", "http://example.com/plan.png", "/\n/example.com/plan.png"]:
            with self.subTest(value=value), self.assertRaises(ValidationError):
                PropertyUnitTypeInput(**{**unit(), "plans": [value]})
        self.assertEqual(PropertyUnitTypeInput(**{**unit(), "code": " 1+1 "}).code, "1+1")
        with self.assertRaises(ValidationError):
            PropertyUnitTypeInput(**{**unit(), "code": " "})

    def test_verified_price_requires_date(self):
        with self.assertRaises(ValidationError):
            DevelopmentProfile(price_status="verified")

    def test_parent_price_is_derived_and_unit_identity_is_preserved(self):
        item = development()
        sync_development(item, [unit(), unit("2+1", 2, 200, 300)])
        first = item.unit_types[0]
        first.id = 7
        sync_development(item, [unit("2+1", 2, 200, 300), unit(minimum=125)])
        self.assertIs(item.unit_types[1], first)
        self.assertEqual(first.id, 7)
        self.assertEqual(item.price, 125)
        self.assertEqual(item.area, 50)
        self.assertIsNone(item.rooms)
        self.assertEqual([u.position for u in item.unit_types], [0, 1])

    def test_empty_or_duplicate_unit_types_are_rejected(self):
        for values in [[], [unit(), unit()]]:
            with self.subTest(values=values), self.assertRaises(HTTPException):
                sync_development(development(), values)

    def test_regular_property_cannot_receive_development_data(self):
        item = Property(listing_kind="property", unit_types=[])
        with self.assertRaises(HTTPException):
            sync_development(item, [unit()])


class DevelopmentLeadTests(unittest.IsolatedAsyncioTestCase):
    async def test_demo_enquiries_and_clicks_are_rejected_without_writes(self):
        item = development()
        item.development = {"is_demo": True}
        db = MagicMock(scalar=AsyncMock(return_value=item), commit=AsyncMock())
        request = Request({"type": "http"})
        tasks = BackgroundTasks()
        with patch("app.api.contacts.enforce_rate_limit", new=AsyncMock()):
            with self.assertRaises(HTTPException) as caught:
                await create_contact(ContactCreate(name="Demo", email="demo@example.com", message="Test", property_id=29), request, tasks, db)
            self.assertEqual(caught.exception.status_code, 422)
            with self.assertRaises(HTTPException):
                await track_contact_action(ContactTrackCreate(property_id=29, channel="whatsapp"), request, db)
        db.add.assert_not_called()
        db.commit.assert_not_awaited()
        self.assertEqual(tasks.tasks, [])

    async def test_real_and_general_enquiries_are_not_blocked(self):
        db = MagicMock(scalar=AsyncMock(return_value=development()))
        await _reject_demo_enquiry(None, db)
        db.scalar.assert_not_awaited()
        await _reject_demo_enquiry(10, db)
        db.scalar.assert_awaited_once()

    async def test_won_is_rejected_for_complex_without_changing_status(self):
        lead = ContactRequest(id=1, property_id=10, status="negotiation", deal_currency="USD")
        item = development()
        item.market_status = "available"
        db = MagicMock(commit=AsyncMock())
        with (patch("app.api.contacts._get_lead", new=AsyncMock(return_value=lead)),
              patch("app.api.contacts._lock_property", new=AsyncMock(return_value=item)),
              patch("app.api.contacts._deal_conversion", new=AsyncMock(return_value=(None, None, None)))):
            with self.assertRaises(HTTPException) as caught:
                await update_contact(1, ContactUpdate(status="won", outcome="sold"),
                                     Request({"type": "http"}), AdminUser(id=1), db)
        self.assertEqual(caught.exception.status_code, 422)
        self.assertEqual(lead.status, "negotiation")
        self.assertEqual(item.market_status, "available")
        db.commit.assert_not_awaited()


@unittest.skipUnless(os.environ.get("RUN_DB_TESTS") == "1", "Set RUN_DB_TESTS=1 for PostgreSQL rollback tests")
class DevelopmentDatabaseTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine(get_settings().DATABASE_URL, poolclass=NullPool)
        self.addAsyncCleanup(self.engine.dispose)
        self.connection = await self.engine.connect()
        self.addAsyncCleanup(self.connection.close)
        self.transaction = await self.connection.begin()
        self.addAsyncCleanup(self.transaction.rollback)
        self.db = AsyncSession(bind=self.connection, expire_on_commit=False, autoflush=False, join_transaction_mode="create_savepoint")
        self.addAsyncCleanup(self.db.close)
        category = Category(name="Development test", slug="test-development-rollback", translations=[])
        self.user = AdminUser(username="development-rollback", email="development-rollback@example.com",
                              full_name="Test", role="founder", password_hash="not-a-real-password")
        self.db.add_all([category, self.user])
        await self.db.flush()
        self.category_id = category.id
        self.request = Request({"type": "http", "method": "POST", "path": "/api/v1/properties",
                                "headers": [], "client": ("127.0.0.1", 12345)})
        self.item = await create_property(PropertyCreate(
            title="Development rollback test", slug="development-rollback-test", price=1,
            category_id=category.id, currency="USD", listing_kind="development", development={},
            unit_types=[unit(), unit("2+1", 2, 200, 300), unit("3+1", 3, 400, 500)],
        ), self.request, self.user, self.db)

    async def list(self, **overrides):
        params = dict(search=None, category_id=self.category_id, city=None, transaction_type=None, min_price=None,
                      max_price=None, rooms=None, min_rooms=None, min_area=None, max_area=None,
                      include_inactive=False, page=1, per_page=12, sort_by="created_at", order="desc",
                      db=self.db, auth_context=None)
        params.update(overrides)
        rate = case((Property.currency == "USD", 100), else_=1)
        with patch("app.api.properties.price_multiplier_rub", new=AsyncMock(return_value=rate)):
            return await list_properties(**params)

    async def test_round_trip_update_preserves_ids_and_derives_price(self):
        before = {u.code: u.id for u in self.item.unit_types}
        updated = await update_property(self.item.id, PropertyUpdate(
            unit_types=[unit("2+1", 2, 220, 330), unit(minimum=110)]),
            self.request, self.user, self.db)
        self.assertEqual(updated.price, 110)
        self.assertEqual({u.code: u.id for u in updated.unit_types}, {code: before[code] for code in ["1+1", "2+1"]})
        self.assertEqual((await self.list()).total, 1)

    async def test_on_request_type_matches_rooms_but_not_numeric_filters(self):
        updated = await update_property(self.item.id, PropertyUpdate(unit_types=[unit(), {"code": "4+1", "rooms": 4}]),
                                        self.request, self.user, self.db)
        self.assertEqual(updated.price, 100)
        self.assertEqual((await self.list(rooms=4)).total, 1)
        self.assertEqual((await self.list(rooms=4, max_price=1000000)).total, 0)
        self.assertEqual((await self.list(rooms=4, min_area=1)).total, 0)

    async def test_plan_area_details_round_trip(self):
        detail = dict(image=unit()["plans"][0], code="A1", area_gross=60, area_net=40, area_with_balcony=45)
        updated = await update_property(self.item.id, PropertyUpdate(unit_types=[{**unit(), "plan_details": [detail]}]),
                                        self.request, self.user, self.db)
        self.assertEqual(updated.unit_types[0].plan_details, [detail])

    async def test_category_filter_does_not_leak_other_categories(self):
        category = Category(name="Another test category", slug="another-development-rollback", translations=[])
        self.db.add(category)
        await self.db.flush()
        self.assertEqual((await self.list(category_id=category.id)).total, 0)

    async def test_price_filters_convert_currency_and_match_the_same_unit(self):
        # 2+1 costs 20,000–30,000 RUB: no match via a cheaper, unrelated 1+1.
        self.assertEqual((await self.list(rooms=2, max_price=16000)).total, 0)
        self.assertEqual((await self.list(rooms=2, min_price=22000, max_price=25000)).total, 1)
        self.assertEqual((await self.list(rooms=3, max_area=70)).total, 0)
        self.assertEqual((await self.list(min_rooms=2, min_area=155)).total, 1)

    async def test_price_order_compares_different_currencies_in_rubles(self):
        ordinary = await create_property(PropertyCreate(title="Ordinary rollback test", price=5000,
            currency="RUB", category_id=self.category_id, rooms=2), self.request, self.user, self.db)
        result = await self.list(sort_by="price", order="asc")
        self.assertEqual([row.id for row in result.items], [ordinary.id, self.item.id])

    async def test_public_listing_excludes_inactive_complex(self):
        await update_property(self.item.id, PropertyUpdate(is_active=False), self.request, self.user, self.db)
        self.assertEqual((await self.list()).total, 0)

    async def test_demo_round_trip_is_public_in_catalog_but_not_featured(self):
        updated = await update_property(self.item.id, PropertyUpdate(development={"is_demo": True}, is_featured=True), self.request, self.user, self.db)
        self.assertTrue(updated.development["is_demo"])
        self.assertFalse(updated.is_featured)
        self.assertEqual((await self.list()).total, 1)
