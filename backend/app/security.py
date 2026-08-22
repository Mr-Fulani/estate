import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Annotated, Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models.admin_user import AdminSession, AdminUser


settings = get_settings()

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "founder": {"*"},
    "admin": {
        "dashboard:view",
        "properties:write",
        "news:write",
        "leads:view",
        "leads:write",
        "reviews:write",
        "categories:write",
        "settings:write",
        "audit:view",
        "profile:write",
    },
    "manager": {
        "dashboard:view",
        "properties:write",
        "leads:view",
        "leads:write",
        "reviews:write",
        "categories:write",
        "profile:write",
    },
    "editor": {"dashboard:view", "properties:write", "news:write", "reviews:write", "profile:write"},
}


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=64)
    return f"scrypt$16384$8$1${salt.hex()}${derived.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt_hex, expected_hex = encoded.split("$", 5)
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=bytes.fromhex(salt_hex),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(bytes.fromhex(expected_hex)),
        )
        return hmac.compare_digest(actual.hex(), expected_hex)
    except (ValueError, TypeError):
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def has_permission(user: AdminUser, permission: str) -> bool:
    permissions = ROLE_PERMISSIONS.get(user.role, set())
    return "*" in permissions or permission in permissions


@dataclass
class AuthContext:
    user: AdminUser
    session: AdminSession


def validate_csrf(request: Request, context: AuthContext) -> None:
    csrf_header = request.headers.get("x-csrf-token")
    csrf_cookie = request.cookies.get(settings.AUTH_CSRF_COOKIE_NAME)
    if (
        not csrf_header
        or not csrf_cookie
        or not hmac.compare_digest(csrf_header, csrf_cookie)
        or not hmac.compare_digest(hash_token(csrf_header), context.session.csrf_token_hash)
    ):
        raise HTTPException(status_code=403, detail="Invalid CSRF token")


async def get_optional_auth_context(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthContext | None:
    token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    if not token:
        return None
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(AdminSession)
        .options(selectinload(AdminSession.user))
        .where(
            AdminSession.token_hash == hash_token(token),
            AdminSession.revoked_at.is_(None),
            AdminSession.expires_at > now,
        )
    )
    session = result.scalars().first()
    if not session or not session.user.is_active:
        return None
    return AuthContext(user=session.user, session=session)


async def require_auth_context(
    context: Annotated[AuthContext | None, Depends(get_optional_auth_context)],
) -> AuthContext:
    if context is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Session"},
        )
    return context


def require_permission(permission: str, *, csrf: bool = False) -> Callable:
    async def dependency(
        request: Request,
        context: Annotated[AuthContext, Depends(require_auth_context)],
    ) -> AdminUser:
        if not has_permission(context.user, permission):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        if csrf:
            validate_csrf(request, context)
        return context.user

    return dependency
