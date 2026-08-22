from datetime import datetime

from pydantic import BaseModel, model_validator


class TelegramSettingsResponse(BaseModel):
    configured: bool
    linked: bool
    bot_username: str | None = None
    telegram_username: str | None = None
    linked_at: datetime | None = None
    notifications_enabled: bool
    can_notify_new_leads: bool
    can_notify_new_reviews: bool
    notify_new_leads: bool
    notify_new_reviews: bool


class TelegramLinkResponse(BaseModel):
    url: str
    expires_at: datetime


class TelegramPreferencesUpdate(BaseModel):
    notifications_enabled: bool | None = None
    notify_new_leads: bool | None = None
    notify_new_reviews: bool | None = None

    @model_validator(mode="after")
    def require_change(self):
        if not self.model_fields_set:
            raise ValueError("Provide at least one notification preference")
        return self


class TelegramActionResponse(BaseModel):
    ok: bool = True
