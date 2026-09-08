import unittest
from unittest.mock import AsyncMock, MagicMock

from app.api.settings import get_settings
from app.schemas.settings import SiteSettingsResponse


class SettingsTests(unittest.IsolatedAsyncioTestCase):
    async def test_empty_installation_get_does_not_create_business_data(self):
        db = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        db.execute.return_value = result
        data = await get_settings(db)
        self.assertIsInstance(data, SiteSettingsResponse)
        self.assertEqual(data.phone, '')
        self.assertEqual(data.email, '')
        self.assertEqual(data.address, '')
        db.commit.assert_not_called()
        db.add.assert_not_called()
