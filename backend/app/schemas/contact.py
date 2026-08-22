from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


LeadStatus = Literal["new", "contacted", "qualified", "viewing", "negotiation", "won", "lost"]
LeadOutcome = Literal["sold", "rented"]
LeadKind = Literal["form", "click", "manual", "webhook"]
LeadChannel = Literal[
    "form", "phone", "email", "whatsapp", "telegram", "max", "instagram", "facebook", "vk"
]
DealCurrency = Literal["RUB", "USD", "EUR", "TRY"]


class AttributionFields(BaseModel):
    locale: Optional[Literal["ru", "en", "tr", "ar"]] = None
    source: str = Field(default="contact_form", max_length=80)
    page_url: Optional[str] = Field(default=None, max_length=2000)
    referrer: Optional[str] = Field(default=None, max_length=2000)
    utm_source: Optional[str] = Field(default=None, max_length=120)
    utm_medium: Optional[str] = Field(default=None, max_length=120)
    utm_campaign: Optional[str] = Field(default=None, max_length=160)
    utm_content: Optional[str] = Field(default=None, max_length=160)
    utm_term: Optional[str] = Field(default=None, max_length=160)
    session_id: Optional[str] = Field(default=None, max_length=100)


class ContactCreate(AttributionFields):
    name: str = Field(min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    message: str = Field(min_length=3, max_length=5000)
    property_id: Optional[int] = None
    kind: Literal["form"] = "form"
    channel: Literal["form"] = "form"
    website: Optional[str] = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def require_contact_method(self):
        if self.website and self.website.strip():
            raise ValueError("Invalid submission")
        if not self.email and not (self.phone and self.phone.strip()):
            raise ValueError("Phone or email is required")
        return self


class ContactTrackCreate(AttributionFields):
    property_id: Optional[int] = None
    kind: Literal["click"] = "click"
    channel: Literal["phone", "email", "whatsapp", "telegram", "max", "instagram", "facebook", "vk"]


class ContactWebhookCreate(BaseModel):
    channel: Literal["whatsapp", "telegram", "max", "instagram", "facebook", "vk"]
    external_conversation_id: str = Field(min_length=1, max_length=200)
    external_message_id: Optional[str] = Field(default=None, max_length=200)
    external_username: Optional[str] = Field(default=None, max_length=160)
    name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    message: str = Field(min_length=1, max_length=5000)
    property_id: Optional[int] = None
    locale: Optional[Literal["ru", "en", "tr", "ar"]] = None
    source: str = Field(default="messenger_webhook", max_length=80)


class ContactUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    outcome: Optional[LeadOutcome] = None
    deal_value: Optional[float] = Field(default=None, ge=0)
    deal_currency: Optional[DealCurrency] = None
    assigned_to: Optional[str] = Field(default=None, max_length=120)
    next_follow_up_at: Optional[datetime] = None
    is_read: Optional[bool] = None
    note: Optional[str] = Field(default=None, max_length=5000)


class LeadNoteCreate(BaseModel):
    note: str = Field(min_length=1, max_length=5000)


class LeadActivityResponse(BaseModel):
    id: int
    event_type: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    note: Optional[str] = None
    event_data: Optional[dict] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadPropertySummary(BaseModel):
    id: int
    title: str
    slug: str
    market_status: str

    model_config = ConfigDict(from_attributes=True)


class ContactResponse(BaseModel):
    id: int
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    message: Optional[str] = None
    property_id: Optional[int] = None
    property: Optional[LeadPropertySummary] = None
    kind: LeadKind
    channel: LeadChannel
    source: str
    locale: Optional[str] = None
    page_url: Optional[str] = None
    referrer: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    session_id: Optional[str] = None
    external_conversation_id: Optional[str] = None
    external_username: Optional[str] = None
    status: LeadStatus
    outcome: Optional[LeadOutcome] = None
    deal_value: Optional[float] = None
    deal_currency: DealCurrency
    deal_value_rub: Optional[float] = None
    deal_exchange_rate: Optional[float] = None
    deal_rate_effective_date: Optional[date] = None
    assigned_to: Optional[str] = None
    next_follow_up_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    is_read: bool
    activities: list[LeadActivityResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
