from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


LocaleCode = Literal["ru", "en", "tr"]
ReviewStatus = Literal["invited", "pending", "published", "rejected"]


class ReviewTranslationInput(BaseModel):
    locale: LocaleCode
    content: str = Field(min_length=10, max_length=5000)
    reviewer_role: str | None = Field(default=None, max_length=160)
    company_response: str | None = Field(default=None, max_length=5000)


class ReviewTranslationResponse(ReviewTranslationInput):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ReviewPublicCreate(BaseModel):
    reviewer_name: str = Field(min_length=2, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    rating: int = Field(ge=1, le=5)
    locale: LocaleCode
    content: str = Field(min_length=10, max_length=5000)
    reviewer_role: str | None = Field(default=None, max_length=160)
    property_id: int | None = None
    consent_given: Literal[True]
    website: str | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def require_contact(self):
        if not self.email and not (self.phone and self.phone.strip()):
            raise ValueError("Phone or email is required")
        return self


class ReviewInvitationSubmit(BaseModel):
    reviewer_name: str = Field(min_length=2, max_length=100)
    rating: int = Field(ge=1, le=5)
    locale: LocaleCode
    content: str = Field(min_length=10, max_length=5000)
    reviewer_role: str | None = Field(default=None, max_length=160)
    consent_given: Literal[True]
    website: str | None = Field(default=None, max_length=200)


class ReviewAdminUpdate(BaseModel):
    reviewer_name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    rating: int | None = Field(default=None, ge=1, le=5)
    status: ReviewStatus | None = None
    is_verified: bool | None = None
    is_featured: bool | None = None
    display_order: int | None = Field(default=None, ge=0)
    property_id: int | None = None
    translations: list[ReviewTranslationInput] | None = None


class ReviewInvitationCreate(BaseModel):
    locale: LocaleCode = "ru"


class ReviewPropertySummary(BaseModel):
    id: int
    title: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class ReviewContactSummary(BaseModel):
    id: int
    name: str | None = None
    status: str
    outcome: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ReviewAdminResponse(BaseModel):
    id: int
    reviewer_name: str | None
    email: EmailStr | None
    phone: str | None
    rating: int | None
    source_locale: str
    status: ReviewStatus
    is_verified: bool
    is_featured: bool
    display_order: int
    consent_given: bool
    property_id: int | None
    contact_id: int | None
    property: ReviewPropertySummary | None
    contact: ReviewContactSummary | None
    has_active_invitation: bool
    invitation_expires_at: datetime | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    translations: list[ReviewTranslationResponse]

    model_config = ConfigDict(from_attributes=True)


class ReviewPublicResponse(BaseModel):
    id: int
    reviewer_name: str
    rating: int
    locale: LocaleCode
    content: str
    reviewer_role: str | None
    company_response: str | None
    is_verified: bool
    property_title: str | None
    published_at: datetime | None


class ReviewListResponse(BaseModel):
    items: list[ReviewPublicResponse]
    total: int
    page: int
    per_page: int


class ReviewInvitationPublicResponse(BaseModel):
    reviewer_name: str | None
    property_title: str | None
    locale: LocaleCode
    expires_at: datetime


class ReviewInvitationAdminResponse(BaseModel):
    review: ReviewAdminResponse
    token: str


class ReviewSubmissionResponse(BaseModel):
    id: int
    status: Literal["pending"]
    is_verified: bool
