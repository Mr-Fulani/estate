from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional


LocaleCode = Literal["ru", "en", "tr", "ar"]


class SiteSettingsTranslationInput(BaseModel):
    locale: LocaleCode
    address: str = Field(min_length=1, max_length=300)
    working_hours: str = Field(min_length=1, max_length=100)


class SiteSettingsTranslationResponse(SiteSettingsTranslationInput):
    id: int

    model_config = ConfigDict(from_attributes=True)

class SiteSettingsBase(BaseModel):
    phone: str = "+90 (552) 123-00-00"
    email: str = "support@estate-agency.ru"
    address: str = "г. Стамбул, Бейликдюзю"
    working_hours: str = "Ежедневно с 9:00 до 21:00"
    telegram: Optional[str] = "https://t.me/estate_agency"
    whatsapp: Optional[str] = "https://wa.me/905521230000"
    vk: Optional[str] = ""
    youtube: Optional[str] = "https://youtube.com/@estate_agency"
    instagram: Optional[str] = ""
    facebook: Optional[str] = ""
    max_messenger: Optional[str] = ""

class SiteSettingsUpdate(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    working_hours: Optional[str] = None
    telegram: Optional[str] = None
    whatsapp: Optional[str] = None
    vk: Optional[str] = None
    youtube: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    max_messenger: Optional[str] = None
    translations: Optional[list[SiteSettingsTranslationInput]] = None

class SiteSettingsResponse(SiteSettingsBase):
    id: int
    translations: list[SiteSettingsTranslationResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
