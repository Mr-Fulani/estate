import hashlib
import hmac
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, status
from sqlalchemy import case
from sqlalchemy.dialects.postgresql import insert

from app.audit import client_ip
from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.rate_limit import PublicRateLimit


settings = get_settings()


def rate_limit_key(request: Request) -> str:
    identity = client_ip(request) or "unknown-client"
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        identity.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


async def enforce_rate_limit(
    request: Request,
    *,
    action: str,
    limit: int,
    window_minutes: int,
) -> None:
    now = datetime.now(timezone.utc)
    reset_before = now - timedelta(minutes=window_minutes)
    key_hash = rate_limit_key(request)

    statement = insert(PublicRateLimit).values(
        key_hash=key_hash,
        action=action,
        window_started_at=now,
        request_count=1,
        updated_at=now,
    )
    statement = statement.on_conflict_do_update(
        constraint="uq_public_rate_limit_key_action",
        set_={
            "window_started_at": case(
                (PublicRateLimit.window_started_at < reset_before, now),
                else_=PublicRateLimit.window_started_at,
            ),
            "request_count": case(
                (PublicRateLimit.window_started_at < reset_before, 1),
                else_=PublicRateLimit.request_count + 1,
            ),
            "updated_at": now,
        },
    ).returning(PublicRateLimit.request_count, PublicRateLimit.window_started_at)

    async with AsyncSessionLocal() as db:
        result = await db.execute(statement)
        request_count, window_started_at = result.one()
        await db.commit()

    if request_count > limit:
        started = window_started_at
        if started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)
        retry_after = max(
            1,
            int((started + timedelta(minutes=window_minutes) - now).total_seconds()),
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )
