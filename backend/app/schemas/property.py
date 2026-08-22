from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional
from datetime import datetime
from .category import CategoryResponse


class PropertyTranslationInput(BaseModel):
    locale: Literal["ru", "en", "tr"]
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    city: Optional[str] = Field(default=None, max_length=100)
    district: Optional[str] = Field(default=None, max_length=100)
    address: Optional[str] = Field(default=None, max_length=300)
    meta_title: Optional[str] = Field(default=None, max_length=240)
    meta_description: Optional[str] = Field(default=None, max_length=320)


class PropertyTranslationResponse(PropertyTranslationInput):
    id: int

    model_config = ConfigDict(from_attributes=True)

class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    currency: str = "RUB"
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    area: Optional[float] = None
    rooms: Optional[int] = None
    min_rooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    year_built: Optional[int] = None
    images: list[str] = Field(default_factory=list)
    category_id: int
    transaction_type: Literal["sale", "rent"] = "sale"
    market_status: Literal["available", "reserved", "sold", "rented", "archived"] = "available"
    status_badge: Optional[str] = "Актуально"

class PropertyCreate(PropertyBase):
    slug: Optional[str] = None
    is_featured: bool = False
    is_active: bool = True
    translations: list[PropertyTranslationInput] = Field(default_factory=list)

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    area: Optional[float] = None
    rooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    year_built: Optional[int] = None
    images: Optional[list[str]] = None
    category_id: Optional[int] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    transaction_type: Optional[Literal["sale", "rent"]] = None
    market_status: Optional[Literal["available", "reserved", "sold", "rented", "archived"]] = None
    status_badge: Optional[str] = None
    translations: Optional[list[PropertyTranslationInput]] = None

class PropertyResponse(PropertyBase):
    id: int
    slug: str
    is_featured: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None
    translations: list[PropertyTranslationResponse] = Field(default_factory=list)

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
