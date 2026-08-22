import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit import add_audit_log
from app.config import get_settings
from app.database import get_db
from app.models.admin_user import AdminUser
from app.schemas.telegram import (
    TelegramActionResponse,
    TelegramLinkResponse,
    TelegramPreferencesUpdate,
    TelegramSettingsResponse,
)
from app.security import AuthContext, has_permission, hash_token, require_auth_context, require_permission
from app.telegram_notifications import (
    send_telegram_message,
    telegram_bot_username,
    telegram_is_configured,
)


router = APIRouter(prefix="/api/v1/telegram", tags=["Telegram notifications"])
settings = get_settings()


def _settings_response(user: AdminUser) -> TelegramSettingsResponse:
    return TelegramSettingsResponse(
        configured=telegram_is_configured(),
        linked=user.telegram_chat_id is not None,
        bot_username=telegram_bot_username(),
        telegram_username=user.telegram_username,
        linked_at=user.telegram_linked_at,
        notifications_enabled=user.telegram_notifications_enabled,
        can_notify_new_leads=has_permission(user, "leads:view"),
        can_notify_new_reviews=has_permission(user, "reviews:write"),
        notify_new_leads=user.telegram_notify_new_leads,
        notify_new_reviews=user.telegram_notify_new_reviews,
    )


@router.get("/settings", response_model=TelegramSettingsResponse)
async def get_telegram_settings(
    context: Annotated[AuthContext, Depends(require_auth_context)],
):
    return _settings_response(context.user)


@router.post("/link", response_model=TelegramLinkResponse)
async def create_telegram_link(
    request: Request,
    current: Annotated[AdminUser, Depends(require_permission("profile:write", csrf=True))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    bot_username = telegram_bot_username()
    if not telegram_is_configured() or not bot_username:
        raise HTTPException(status_code=503, detail="Telegram bot is not configured")
    token = secrets.token_urlsafe(24)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    current.telegram_link_token_hash = hash_token(token)
    current.telegram_link_expires_at = expires_at
    add_audit_log(
        db,
        request,
        current,
        "telegram.link_requested",
        "admin_user",
        current.id,
    )
    await db.commit()
    return TelegramLinkResponse(
        url=f"https://t.me/{quote(bot_username)}?start={quote(token)}",
        expires_at=expires_at,
    )


@router.patch("/settings", response_model=TelegramSettingsResponse)
async def update_telegram_settings(
    payload: TelegramPreferencesUpdate,
    request: Request,
    current: Annotated[AdminUser, Depends(require_permission("profile:write", csrf=True))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("notify_new_leads") is True and not has_permission(current, "leads:view"):
        raise HTTPException(status_code=403, detail="Your role cannot receive lead notifications")
    if changes.get("notify_new_reviews") is True and not has_permission(current, "reviews:write"):
        raise HTTPException(status_code=403, detail="Your role cannot receive review notifications")
    if changes.get("notifications_enabled") is True:
        if current.telegram_chat_id is None:
            raise HTTPException(status_code=422, detail="Link Telegram before enabling notifications")
        if not telegram_is_configured():
            raise HTTPException(status_code=503, detail="Telegram bot is not configured")
    for field, value in changes.items():
        setattr(current, f"telegram_{field}", value)
    add_audit_log(
        db,
        request,
        current,
        "telegram.preferences_updated",
        "admin_user",
        current.id,
        {"fields": sorted(changes)},
    )
    await db.commit()
    await db.refresh(current)
    return _settings_response(current)


@router.delete("/link", response_model=TelegramActionResponse)
async def disconnect_telegram(
    request: Request,
    current: Annotated[AdminUser, Depends(require_permission("profile:write", csrf=True))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    current.telegram_chat_id = None
    current.telegram_username = None
    current.telegram_linked_at = None
    current.telegram_link_token_hash = None
    current.telegram_link_expires_at = None
    current.telegram_notifications_enabled = False
    add_audit_log(
        db,
        request,
        current,
        "telegram.disconnected",
        "admin_user",
        current.id,
    )
    await db.commit()
    return TelegramActionResponse()


@router.post("/test", response_model=TelegramActionResponse)
async def send_test_notification(
    background_tasks: BackgroundTasks,
    current: Annotated[AdminUser, Depends(require_permission("profile:write", csrf=True))],
):
    if current.telegram_chat_id is None:
        raise HTTPException(status_code=422, detail="Telegram is not linked")
    if not telegram_is_configured():
        raise HTTPException(status_code=503, detail="Telegram bot is not configured")
    background_tasks.add_task(
        send_telegram_message,
        current.telegram_chat_id,
        "<b>Rahat Home Admin</b>\nТестовое уведомление доставлено. Настройка работает.",
    )
    return TelegramActionResponse()


@router.post("/webhook", response_model=TelegramActionResponse)
async def telegram_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    webhook_secret: Annotated[
        str | None,
        Header(alias="X-Telegram-Bot-Api-Secret-Token"),
    ] = None,
):
    if not settings.TELEGRAM_WEBHOOK_SECRET or not webhook_secret or not hmac.compare_digest(
        webhook_secret,
        settings.TELEGRAM_WEBHOOK_SECRET,
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid webhook secret")

    payload = await request.json()
    message = payload.get("message") if isinstance(payload, dict) else None
    text = message.get("text") if isinstance(message, dict) else None
    chat = message.get("chat") if isinstance(message, dict) else None
    if not isinstance(text, str) or not isinstance(chat, dict) or chat.get("type") != "private":
        return TelegramActionResponse()

    command = text.strip().split(maxsplit=1)
    if len(command) != 2 or not command[0].split("@", 1)[0].lower() == "/start":
        return TelegramActionResponse()
    token = command[1].strip()
    if not token:
        return TelegramActionResponse()

    try:
        chat_id = int(chat["id"])
    except (KeyError, TypeError, ValueError):
        return TelegramActionResponse()

    now = datetime.now(timezone.utc)
    user = await db.scalar(
        select(AdminUser)
        .where(
            AdminUser.telegram_link_token_hash == hash_token(token),
            AdminUser.telegram_link_expires_at > now,
            AdminUser.is_active.is_(True),
        )
        .with_for_update()
    )
    if user is None:
        background_tasks.add_task(
            send_telegram_message,
            chat_id,
            "Ссылка недействительна или истекла. Создайте новую в профиле Rahat Home Admin.",
        )
        return TelegramActionResponse()

    existing = await db.scalar(
        select(AdminUser.id).where(
            AdminUser.telegram_chat_id == chat_id,
            AdminUser.id != user.id,
        )
    )
    if existing is not None:
        background_tasks.add_task(
            send_telegram_message,
            chat_id,
            "Этот Telegram уже связан с другим аккаунтом Rahat Home Admin.",
        )
        return TelegramActionResponse()

    telegram_user = message.get("from") if isinstance(message.get("from"), dict) else {}
    username = telegram_user.get("username")
    user.telegram_chat_id = chat_id
    user.telegram_username = str(username)[:80] if username else None
    user.telegram_linked_at = now
    user.telegram_link_token_hash = None
    user.telegram_link_expires_at = None
    user.telegram_notifications_enabled = True
    add_audit_log(
        db,
        request,
        user,
        "telegram.connected",
        "admin_user",
        user.id,
    )
    await db.commit()
    background_tasks.add_task(
        send_telegram_message,
        chat_id,
        "<b>Telegram подключён</b>\nУведомления Rahat Home Admin включены. Настройки можно изменить в профиле.",
    )
    return TelegramActionResponse()
