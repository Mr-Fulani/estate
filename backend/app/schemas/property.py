from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from .category import CategoryResponse

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
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    year_built: Optional[int] = None
    images: list[str] = []
    category_id: int

class PropertyCreate(PropertyBase):
    slug: Optional[str] = None

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

class PropertyResponse(PropertyBase):
    id: int
    slug: str
    is_featured: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None

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
