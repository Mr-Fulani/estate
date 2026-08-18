from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
