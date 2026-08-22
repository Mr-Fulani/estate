from datetime import datetime
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator


AdminRole = Literal["founder", "admin", "manager", "editor"]


def _normalize_email(value: str) -> str:
    normalized = value.strip().lower()
    if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
        raise ValueError("Enter a valid email address")
    return normalized


def _normalize_username(value: str) -> str:
    normalized = value.strip().lower()
    allowed = set("abcdefghijklmnopqrstuvwxyz0123456789._-")
    if len(normalized) < 3 or any(character not in allowed for character in normalized):
        raise ValueError("Use at least 3 Latin letters, numbers, dots, dashes or underscores")
    if not normalized[0].isalnum():
        raise ValueError("Username must start with a letter or number")
    return normalized


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str
    role: AdminRole
    is_active: bool
    last_login_at: datetime | None = None
    created_at: datetime


class LoginRequest(BaseModel):
    identifier: str = Field(
        min_length=3,
        max_length=200,
        validation_alias=AliasChoices("identifier", "email"),
    )
    password: str = Field(min_length=1, max_length=256)

    @field_validator("identifier")
    @classmethod
    def normalize_identifier(cls, value: str) -> str:
        return value.strip().lower()


class AuthResponse(BaseModel):
    user: AdminUserResponse
    csrf_token: str
    expires_at: datetime


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=256)
    new_password: str = Field(min_length=12, max_length=256)


class PasswordChangeResponse(BaseModel):
    ok: bool = True
    revoked_sessions: int = 0


class AdminUserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: str = Field(min_length=5, max_length=200)
    full_name: str = Field(min_length=2, max_length=120)
    role: AdminRole = "manager"
    password: str = Field(min_length=12, max_length=256)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return _normalize_email(value)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return _normalize_username(value)


class AdminUserUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=80)
    full_name: str | None = Field(None, min_length=2, max_length=120)
    role: AdminRole | None = None
    is_active: bool | None = None
    password: str | None = Field(None, min_length=12, max_length=256)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str | None) -> str | None:
        return _normalize_username(value) if value is not None else None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action: str
    resource_type: str
    resource_id: str | None = None
    details: dict | None = None
    ip_address: str | None = None
    created_at: datetime
    user: AdminUserResponse | None = None


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    per_page: int
