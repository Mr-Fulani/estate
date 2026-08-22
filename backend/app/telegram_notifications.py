import asyncio
import html
import logging
from typing import Literal

import httpx
from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.admin_user import AdminUser
from app.security import has_permission


logger = logging.getLogger(__name__)
settings = get_settings()
TelegramNotificationEvent = Literal["new_lead", "new_review"]


def telegram_is_configured() -> bool:
    return bool(
        settings.TELEGRAM_BOT_TOKEN
        and settings.TELEGRAM_BOT_USERNAME
        and settings.TELEGRAM_WEBHOOK_SECRET
    )


def telegram_bot_username() -> str | None:
    value = settings.TELEGRAM_BOT_USERNAME.strip().lstrip("@")
    return value or None


async def send_telegram_message(chat_id: int, text: str) -> bool:
    if not settings.TELEGRAM_BOT_TOKEN:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
        payload = response.json()
        if response.is_success and isinstance(payload, dict) and payload.get("ok") is True:
            return True
        logger.warning("Telegram rejected an administrative notification")
    except (httpx.HTTPError, ValueError):
        logger.warning("Telegram administrative notification could not be delivered")
    return False


async def _send_many(chat_ids: list[int], text: str) -> None:
    await asyncio.gather(
        *(send_telegram_message(chat_id, text) for chat_id in chat_ids),
        return_exceptions=True,
    )


async def queue_admin_notification(
    db: AsyncSession,
    background_tasks: BackgroundTasks,
    event: TelegramNotificationEvent,
    text: str,
) -> None:
    if not telegram_is_configured():
        return
    preference = (
        AdminUser.telegram_notify_new_leads
        if event == "new_lead"
        else AdminUser.telegram_notify_new_reviews
    )
    result = await db.execute(
        select(AdminUser).where(
            AdminUser.is_active.is_(True),
            AdminUser.telegram_chat_id.is_not(None),
            AdminUser.telegram_notifications_enabled.is_(True),
            preference.is_(True),
        )
    )
    permission = "leads:view" if event == "new_lead" else "reviews:write"
    chat_ids = [
        user.telegram_chat_id
        for user in result.scalars().all()
        if user.telegram_chat_id is not None and has_permission(user, permission)
    ]
    if chat_ids:
        background_tasks.add_task(_send_many, chat_ids, text)


def new_lead_message(
    *,
    lead_id: int,
    name: str | None,
    phone: str | None,
    email: str | None,
    message: str | None,
) -> str:
    contact = phone or email or "не указан"
    summary = (message or "Без сообщения").strip()
    if len(summary) > 350:
        summary = f"{summary[:347]}…"
    url = f"{settings.ADMIN_PANEL_URL.rstrip('/')}/leads"
    return (
        "<b>Новая заявка с сайта</b>\n"
        f"Клиент: {html.escape(name or 'Без имени')}\n"
        f"Контакт: {html.escape(contact)}\n"
        f"Сообщение: {html.escape(summary)}\n\n"
        f'<a href="{html.escape(url, quote=True)}">Открыть лид #{lead_id}</a>'
    )


def new_review_message(
    *,
    review_id: int,
    reviewer_name: str,
    rating: int,
    content: str,
    verified: bool,
) -> str:
    summary = content.strip()
    if len(summary) > 350:
        summary = f"{summary[:347]}…"
    url = f"{settings.ADMIN_PANEL_URL.rstrip('/')}/reviews"
    verification = "подтверждённый" if verified else "публичная форма"
    return (
        "<b>Новый отзыв на модерации</b>\n"
        f"Автор: {html.escape(reviewer_name)}\n"
        f"Оценка: {rating}/5\n"
        f"Источник: {verification}\n"
        f"Текст: {html.escape(summary)}\n\n"
        f'<a href="{html.escape(url, quote=True)}">Открыть отзыв #{review_id}</a>'
    )
