import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException, Request
from pydantic import ValidationError

from app.api.auth import change_current_password
from app.models.admin_user import AdminSession, AdminUser
from app.schemas.auth import PasswordChangeRequest
from app.security import AuthContext, hash_password, hash_token, verify_password


CURRENT_PASSWORD = "current-password-123"
NEW_PASSWORD = "new-password-456"
CSRF_TOKEN = "csrf-token-for-password-test"


def password_request(*, valid_csrf: bool = True) -> Request:
    header_token = CSRF_TOKEN if valid_csrf else "wrong-token"
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/auth/me/password",
            "headers": [
                (b"cookie", f"estate_admin_csrf={CSRF_TOKEN}".encode("ascii")),
                (b"x-csrf-token", header_token.encode("ascii")),
            ],
            "client": ("198.51.100.20", 12345),
        }
    )


def auth_context() -> AuthContext:
    user = AdminUser(
        id=7,
        username="manager",
        email="manager@example.com",
        full_name="Manager",
        role="manager",
        password_hash=hash_password(CURRENT_PASSWORD),
        is_active=True,
    )
    session = AdminSession(
        id=19,
        user_id=user.id,
        token_hash=hash_token("session-token"),
        csrf_token_hash=hash_token(CSRF_TOKEN),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    return AuthContext(user=user, session=session)


def fake_db(*, revoked_sessions: int = 0):
    db = MagicMock()
    db.add = MagicMock()
    db.execute = AsyncMock(return_value=SimpleNamespace(rowcount=revoked_sessions))
    db.commit = AsyncMock()
    return db


class PasswordChangeSchemaTests(unittest.TestCase):
    def test_requires_twelve_character_new_password(self):
        with self.assertRaises(ValidationError):
            PasswordChangeRequest(current_password="current", new_password="too-short")


class PasswordChangeEndpointTests(unittest.IsolatedAsyncioTestCase):
    async def test_changes_hash_and_revokes_only_other_sessions(self):
        context = auth_context()
        db = fake_db(revoked_sessions=2)
        payload = PasswordChangeRequest(
            current_password=CURRENT_PASSWORD,
            new_password=NEW_PASSWORD,
        )

        with patch("app.api.auth.enforce_rate_limit", new=AsyncMock()) as limiter:
            response = await change_current_password(payload, password_request(), context, db)

        self.assertTrue(response.ok)
        self.assertEqual(response.revoked_sessions, 2)
        self.assertTrue(verify_password(NEW_PASSWORD, context.user.password_hash))
        self.assertFalse(verify_password(CURRENT_PASSWORD, context.user.password_hash))
        self.assertIsNone(context.session.revoked_at)
        limiter.assert_awaited_once()
        db.execute.assert_awaited_once()
        statement = db.execute.await_args.args[0]
        sql = str(statement.compile(compile_kwargs={"literal_binds": True}))
        self.assertIn("admin_sessions.id != 19", sql)
        db.commit.assert_awaited_once()

    async def test_rejects_incorrect_current_password(self):
        context = auth_context()
        original_hash = context.user.password_hash
        db = fake_db()
        payload = PasswordChangeRequest(
            current_password="incorrect-password",
            new_password=NEW_PASSWORD,
        )

        with patch("app.api.auth.enforce_rate_limit", new=AsyncMock()):
            with self.assertRaises(HTTPException) as caught:
                await change_current_password(payload, password_request(), context, db)

        self.assertEqual(caught.exception.status_code, 422)
        self.assertEqual(context.user.password_hash, original_hash)
        db.execute.assert_not_awaited()
        db.commit.assert_awaited_once()

    async def test_rejects_password_reuse(self):
        context = auth_context()
        db = fake_db()
        payload = PasswordChangeRequest(
            current_password=CURRENT_PASSWORD,
            new_password=CURRENT_PASSWORD,
        )

        with patch("app.api.auth.enforce_rate_limit", new=AsyncMock()):
            with self.assertRaises(HTTPException) as caught:
                await change_current_password(payload, password_request(), context, db)

        self.assertEqual(caught.exception.status_code, 422)
        db.execute.assert_not_awaited()
        db.commit.assert_not_awaited()

    async def test_requires_valid_csrf_before_password_check(self):
        context = auth_context()
        db = fake_db()
        payload = PasswordChangeRequest(
            current_password=CURRENT_PASSWORD,
            new_password=NEW_PASSWORD,
        )
        limiter = AsyncMock()

        with patch("app.api.auth.enforce_rate_limit", new=limiter):
            with self.assertRaises(HTTPException) as caught:
                await change_current_password(
                    payload,
                    password_request(valid_csrf=False),
                    context,
                    db,
                )

        self.assertEqual(caught.exception.status_code, 403)
        limiter.assert_not_awaited()
        db.commit.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
