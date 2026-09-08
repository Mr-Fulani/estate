from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.services.slug_history import validate_public_slug
from app.site_runtime import site_runtime


class LandingFilters(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    category_id: int | None = Field(default=None, ge=1)
    city: str | None = Field(default=None, max_length=120)
    transaction_type: Literal['sale','rent'] | None = None


class LandingTranslation(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    title: str = Field(default='', max_length=240)
    description: str = Field(default='', max_length=500)
    content: str = Field(default='', max_length=100000)
    meta_title: str = Field(default='', max_length=240)


class LandingInput(BaseModel):
    slug: str
    is_published: bool = False
    filters: LandingFilters = Field(default_factory=LandingFilters)
    translations: dict[Literal['ru','en','tr','ar'], LandingTranslation] = Field(default_factory=dict)

    @field_validator('slug')
    @classmethod
    def valid_slug(cls, value):
        return validate_public_slug(value)

    @model_validator(mode='after')
    def publish_complete_content(self):
        if self.is_published:
            primary = self.translations.get(site_runtime()['default_locale'])
            if not primary or not (primary.title and primary.description and primary.content):
                raise ValueError('Complete content in the default language is required before publishing')
        return self


class LandingResponse(LandingInput):
    id: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='after')
    def publish_complete_content(self):
        # Publication validation belongs to writes; reads may outlive a locale configuration change.
        return self
