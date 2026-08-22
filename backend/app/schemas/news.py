from datetime import datetime
import re
from typing import Literal
from urllib.parse import parse_qs, urlparse

from pydantic import BaseModel, ConfigDict, Field, model_validator


LocaleCode = Literal["ru", "en", "tr", "ar"]
MediaType = Literal["image", "youtube"]
YOUTUBE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")


def _youtube_video_id(value: str) -> str | None:
    parsed = urlparse(value)
    host = (parsed.hostname or "").lower().removeprefix("www.")
    if host == "youtu.be":
        candidate = parsed.path.strip("/").split("/")[0]
    elif host in {"youtube.com", "m.youtube.com", "youtube-nocookie.com"}:
        if parsed.path == "/watch":
            candidate = parse_qs(parsed.query).get("v", [""])[0]
        elif parsed.path.startswith(("/embed/", "/shorts/", "/live/")):
            candidate = parsed.path.strip("/").split("/")[1]
        else:
            return None
    else:
        return None
    return candidate if YOUTUBE_ID_PATTERN.fullmatch(candidate) else None


class NewsMediaBase(BaseModel):
    media_type: MediaType
    url: str = Field(min_length=1, max_length=1000)
    position: int = Field(default=0, ge=0, le=1000)

    @model_validator(mode="after")
    def validate_url(self):
        value = self.url.strip()
        if self.media_type == "image":
            parsed = urlparse(value)
            is_local = value.startswith("/") and not value.startswith("//")
            is_remote = parsed.scheme in {"http", "https"} and bool(parsed.netloc)
            if not (is_local or is_remote):
                raise ValueError("Image URL must be absolute or start with /")
        elif _youtube_video_id(value) is None:
            raise ValueError("Enter a valid YouTube URL")
        self.url = value
        return self


class NewsMediaResponse(NewsMediaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class NewsTranslationBase(BaseModel):
    locale: LocaleCode
    title: str = Field(min_length=1, max_length=240)
    excerpt: str = Field(min_length=1, max_length=500)
    content: str = Field(min_length=1)
    meta_title: str | None = Field(default=None, max_length=240)
    meta_description: str | None = Field(default=None, max_length=320)


class NewsTranslationResponse(NewsTranslationBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class NewsArticleCreate(BaseModel):
    slug: str | None = Field(default=None, max_length=220)
    cover_image: str | None = Field(default=None, max_length=1000)
    author: str = Field(default="Rahat Home", min_length=1, max_length=120)
    is_published: bool = False
    published_at: datetime | None = None
    translations: list[NewsTranslationBase] = Field(min_length=1)
    media: list[NewsMediaBase] = Field(default_factory=list, max_length=50)


class NewsArticleUpdate(BaseModel):
    slug: str | None = Field(default=None, max_length=220)
    cover_image: str | None = Field(default=None, max_length=1000)
    author: str | None = Field(default=None, min_length=1, max_length=120)
    is_published: bool | None = None
    published_at: datetime | None = None
    translations: list[NewsTranslationBase] | None = None
    media: list[NewsMediaBase] | None = Field(default=None, max_length=50)


class NewsAdminResponse(BaseModel):
    id: int
    slug: str
    cover_image: str | None
    author: str
    is_published: bool
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    translations: list[NewsTranslationResponse]
    media: list[NewsMediaResponse]

    model_config = ConfigDict(from_attributes=True)


class NewsPublicResponse(BaseModel):
    id: int
    slug: str
    locale: LocaleCode
    title: str
    excerpt: str
    content: str
    meta_title: str | None
    meta_description: str | None
    cover_image: str | None
    author: str
    published_at: datetime | None
    media: list[NewsMediaResponse]
    available_locales: list[LocaleCode]


class NewsListResponse(BaseModel):
    items: list[NewsPublicResponse]
    total: int
    page: int
    per_page: int
