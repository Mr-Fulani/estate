from functools import lru_cache
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "change-me"
    CORS_ORIGINS: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    CRM_WEBHOOK_SECRET: str = ""
    AUTH_COOKIE_NAME: str = "estate_admin_session"
    AUTH_CSRF_COOKIE_NAME: str = "estate_admin_csrf"
    AUTH_SESSION_HOURS: int = 12
    AUTH_COOKIE_SECURE: bool = False
    AUTH_LOGIN_WINDOW_MINUTES: int = 15
    AUTH_LOGIN_MAX_ATTEMPTS: int = 10
    TRUSTED_PROXY_NETWORKS: str = "127.0.0.0/8,::1/128,172.16.0.0/12"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1,api,testserver"
    PUBLIC_FORM_RATE_LIMIT: int = 5
    PUBLIC_TRACK_RATE_LIMIT: int = 30
    PUBLIC_REVIEW_RATE_LIMIT: int = 3
    PUBLIC_RATE_WINDOW_MINUTES: int = 15
    PUBLIC_REVIEW_RATE_WINDOW_MINUTES: int = 60
    MEDIA_ROOT: str = "/app/uploads"
    MEDIA_URL: str = "/uploads"
    MEDIA_MAX_IMAGE_MB: int = 12
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_BOT_USERNAME: str = ""
    TELEGRAM_WEBHOOK_SECRET: str = ""
    ADMIN_PANEL_URL: str = "http://localhost:3000/admin"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def validate_production_security(self):
        telegram_values = (
            self.TELEGRAM_BOT_TOKEN,
            self.TELEGRAM_BOT_USERNAME,
            self.TELEGRAM_WEBHOOK_SECRET,
        )
        if any(telegram_values) and not all(telegram_values):
            raise ValueError(
                "TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME and TELEGRAM_WEBHOOK_SECRET "
                "must be configured together"
            )
        allowed_webhook_secret = set(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"
        )
        if self.TELEGRAM_WEBHOOK_SECRET and any(
            character not in allowed_webhook_secret
            for character in self.TELEGRAM_WEBHOOK_SECRET
        ):
            raise ValueError(
                "TELEGRAM_WEBHOOK_SECRET may contain only letters, numbers, underscores and dashes"
            )
        if len(self.TELEGRAM_WEBHOOK_SECRET) > 256:
            raise ValueError("TELEGRAM_WEBHOOK_SECRET may contain at most 256 characters")
        if self.ENVIRONMENT == "production":
            if len(self.SECRET_KEY) < 32 or self.SECRET_KEY in {"change-me", "change-me-in-production"}:
                raise ValueError("Production SECRET_KEY must contain at least 32 random characters")
            if not self.AUTH_COOKIE_SECURE:
                raise ValueError("AUTH_COOKIE_SECURE must be true in production")
            if self.TELEGRAM_WEBHOOK_SECRET and len(self.TELEGRAM_WEBHOOK_SECRET) < 16:
                raise ValueError("TELEGRAM_WEBHOOK_SECRET must contain at least 16 characters")
        return self

@lru_cache
def get_settings() -> Settings:
    return Settings()
