from app.schemas.image_text import ImageDetails
from app.services.slug_history import validate_public_slug
from app.config import get_settings
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import Literal, Optional
from datetime import date, datetime
from .category import CategoryResponse


def validate_media_url(value: str) -> str:
    from urllib.parse import urlsplit
    parsed = urlsplit(value)
    if any(ord(char) < 32 for char in value):
        raise ValueError("Media URLs cannot contain control characters")
    if value.startswith("/") and not parsed.scheme and not parsed.netloc and "\\" not in value:
        return value
    if parsed.scheme == "https" and parsed.netloc and not parsed.username:
        return value
    raise ValueError("Use a site-relative path or an HTTPS URL")


class DevelopmentCopy(BaseModel):
    eyebrow: str = Field(default="", max_length=100)
    headline: str = Field(default="", max_length=200)
    story_title: str = Field(default="", max_length=200)
    story: str = Field(default="", max_length=6000)
    location_description: str = Field(default="", max_length=3000)
    purchase_note: str = Field(default="", max_length=2000)
    amenities: list[str] = Field(default_factory=list, max_length=16)


class DevelopmentProfile(BaseModel):
    is_demo: bool = False
    developer: str = Field(default="", max_length=100)
    design_brand: str = Field(default="", max_length=100)
    price_date: date | None = None
    price_status: Literal["indicative", "verified"] = "indicative"
    images_are_renders: bool = True
    interior_images: list[str] = Field(default_factory=list, max_length=30)
    brochure_url: str | None = None
    translations: dict[Literal["ru", "en", "tr", "ar"], DevelopmentCopy] = Field(default_factory=dict)

    @field_validator("interior_images")
    @classmethod
    def validate_images(cls, values):
        return [validate_media_url(value) for value in values]

    @field_validator("brochure_url")
    @classmethod
    def validate_brochure(cls, value):
        return validate_media_url(value) if value else None

    @model_validator(mode="after")
    def verified_date(self):
        if self.price_status == "verified" and self.price_date is None:
            raise ValueError("A verified price needs a confirmation date")
        if self.price_date and self.price_date > date.today():
            raise ValueError("Price date cannot be in the future")
        return self


class PropertyPlanDetail(BaseModel):
    image: str
    code: str = Field(min_length=1, max_length=60)
    area_gross: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    area_net: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    area_with_balcony: float | None = Field(default=None, gt=0, allow_inf_nan=False)

    @field_validator("image")
    @classmethod
    def validate_image(cls, value):
        return validate_media_url(value)

    @model_validator(mode="after")
    def area_order(self):
        known = [v for v in [self.area_net, self.area_with_balcony, self.area_gross] if v is not None]
        if known != sorted(known):
            raise ValueError("Net area cannot exceed area including balcony or gross area")
        return self


class PropertyUnitTypeInput(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    rooms: int = Field(ge=1, le=50)
    area_min: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    area_max: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    price_min: float | None = Field(default=None, gt=0, lt=10_000_000_000, allow_inf_nan=False)
    price_max: float | None = Field(default=None, gt=0, lt=10_000_000_000, allow_inf_nan=False)
    plans: list[str] = Field(default_factory=list, max_length=20)
    plan_details: list[PropertyPlanDetail] = Field(default_factory=list, max_length=20)
    position: int = Field(default=0, ge=0)

    @field_validator("code", mode="before")
    @classmethod
    def trim_code(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("plans")
    @classmethod
    def validate_plans(cls, values):
        return [validate_media_url(value) for value in values]

    @model_validator(mode="after")
    def ordered_ranges(self):
        for low, high in [(self.area_min, self.area_max), (self.price_min, self.price_max)]:
            if (low is None) != (high is None):
                raise ValueError("Provide both range boundaries, or leave both empty for on-request data")
            if low is not None and high < low:
                raise ValueError("Range maximum must be at least its minimum")
        images = [detail.image for detail in self.plan_details]
        if len(images) != len(set(images)) or any(image not in self.plans for image in images):
            raise ValueError("Plan details must reference unique images included in this apartment type")
        return self


class PropertyUnitTypeResponse(PropertyUnitTypeInput):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PropertyTranslationInput(BaseModel):
    locale: Literal["ru", "en", "tr", "ar"]
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    city: Optional[str] = Field(default=None, max_length=100)
    district: Optional[str] = Field(default=None, max_length=100)
    address: Optional[str] = Field(default=None, max_length=300)
    meta_title: Optional[str] = Field(default=None, max_length=240)
    meta_description: Optional[str] = Field(default=None, max_length=320)
    status_badge: Optional[str] = Field(default=None, max_length=100)


class PropertyTranslationResponse(PropertyTranslationInput):
    id: int

    model_config = ConfigDict(from_attributes=True)

class PropertyBase(BaseModel):
    content_locale: Literal["ru", "en", "tr", "ar"] = Field(default_factory=lambda: get_settings().SITE_DEFAULT_LOCALE)
    title: str
    description: Optional[str] = None
    price: float
    currency: Literal["RUB", "USD", "EUR", "TRY"] = Field(default_factory=lambda: get_settings().SITE_DEFAULT_CURRENCY)
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    area: Optional[float] = None
    rooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    year_built: Optional[int] = None
    images: list[str] = Field(default_factory=list)
    image_details: ImageDetails = Field(default_factory=dict, max_length=100)
    category_id: int
    transaction_type: Literal["sale", "rent"] = "sale"
    market_status: Literal["available", "reserved", "sold", "rented", "archived"] = "available"
    status_badge: Optional[str] = "Актуально"
    listing_kind: Literal["property", "development"] = "property"
    development: DevelopmentProfile | None = None

class PropertyCreate(PropertyBase):
    slug: Optional[str] = None

    @field_validator('slug')
    @classmethod
    def valid_slug(cls, value):
        return validate_public_slug(value) if value is not None else value

    is_featured: bool = False
    is_active: bool = True
    translations: list[PropertyTranslationInput] = Field(default_factory=list)
    unit_types: list[PropertyUnitTypeInput] = Field(default_factory=list, max_length=50)

class PropertyUpdate(BaseModel):
    slug: str | None = None

    @field_validator('slug')
    @classmethod
    def valid_slug(cls, value):
        return validate_public_slug(value)

    content_locale: Literal["ru", "en", "tr", "ar"] | None = None
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Literal["RUB", "USD", "EUR", "TRY"] | None = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    area: Optional[float] = None
    rooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    year_built: Optional[int] = None
    images: Optional[list[str]] = None
    image_details: ImageDetails | None = Field(default=None, max_length=100)
    category_id: Optional[int] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    transaction_type: Optional[Literal["sale", "rent"]] = None
    market_status: Optional[Literal["available", "reserved", "sold", "rented", "archived"]] = None
    status_badge: Optional[str] = None
    translations: Optional[list[PropertyTranslationInput]] = None
    listing_kind: Literal["property", "development"] | None = None
    development: DevelopmentProfile | None = None
    unit_types: list[PropertyUnitTypeInput] | None = Field(default=None, max_length=50)

class PropertyResponse(PropertyBase):
    id: int
    slug: str
    is_featured: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None
    translations: list[PropertyTranslationResponse] = Field(default_factory=list)
    unit_types: list[PropertyUnitTypeResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class PropertyListResponse(BaseModel):
    items: list[PropertyResponse]
    total: int
    page: int
    per_page: int

class PropertyFilter(BaseModel):
    search: Optional[str] = None
    category_id: Optional[int] = None
    city: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    rooms: Optional[int] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
