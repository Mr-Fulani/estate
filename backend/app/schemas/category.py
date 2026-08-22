from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Literal, Optional


LocaleCode = Literal["ru", "en", "tr", "ar"]


class CategoryTranslationInput(BaseModel):
    locale: LocaleCode
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None


class CategoryTranslationResponse(CategoryTranslationInput):
    id: int

    model_config = ConfigDict(from_attributes=True)

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    translations: list[CategoryTranslationInput] = Field(default_factory=list)

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    translations: list[CategoryTranslationResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
