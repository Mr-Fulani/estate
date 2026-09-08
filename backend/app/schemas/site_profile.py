"""Business data for one installation; domain stays in deployment configuration."""
from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator

Locale = Literal['ru', 'en', 'tr', 'ar']
Page = Literal['home', 'properties', 'services', 'about', 'contact', 'news', 'reviews', 'privacy', 'terms']


class PageSeo(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    title: str = Field(default='', max_length=240)
    description: str = Field(default='', max_length=500)


class SiteProfile(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    brand_name: str = Field(default='', max_length=120)
    legal_name: str = Field(default='', max_length=240)
    logo_url: str = Field(default='', max_length=1000)
    icon_url: str = Field(default='', max_length=1000)
    og_image_url: str = Field(default='', max_length=1000)
    hero_image_url: str = Field(default='', max_length=1000)
    about_image_url: str = Field(default='', max_length=1000)
    address_locality: str = Field(default='', max_length=120)
    address_region: str = Field(default='', max_length=120)
    address_country: str = Field(default='', max_length=2, pattern=r'^([A-Z]{2})?$')
    postal_code: str = Field(default='', max_length=20)
    seo: dict[Locale, dict[Page, PageSeo]] = Field(default_factory=dict)
    text_overrides: dict[Locale, dict[str, str]] = Field(default_factory=dict, alias='copy')

    @field_validator('logo_url', 'icon_url', 'og_image_url', 'hero_image_url', 'about_image_url')
    @classmethod
    def safe_asset_url(cls, value):
        if not value or (value.startswith('/') and not value.startswith('//') and '\\' not in value):
            return value
        url = urlparse(value)
        if url.scheme != 'https' or not url.hostname or url.username or url.password:
            raise ValueError('Use an HTTPS URL or a local path starting with /')
        return value

    @field_validator('text_overrides')
    @classmethod
    def bounded_copy(cls, value):
        for entries in value.values():
            if len(entries) > 1200:
                raise ValueError('Too many text fields')
            for key, text in entries.items():
                if len(key) > 160 or len(text) > 20000 or any(part in {'__proto__', 'prototype', 'constructor'} for part in key.split('.')):
                    raise ValueError('Invalid text field')
        return value
