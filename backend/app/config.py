from functools import lru_cache
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
    MEDIA_ROOT: str = "/app/uploads"
    MEDIA_URL: str = "/uploads"
    MEDIA_MAX_IMAGE_MB: int = 12

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache
def get_settings() -> Settings:
    return Settings()
