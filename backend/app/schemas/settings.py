from pydantic import BaseModel, ConfigDict
from typing import Optional

class SiteSettingsBase(BaseModel):
    phone: str = "+7 (495) 123-45-67"
    email: str = "info@estate-agency.ru"
    address: str = "г. Москва, Пресненская набережная, 12, Башня Федерация"
    working_hours: str = "Ежедневно с 9:00 до 21:00"
    telegram: Optional[str] = "https://t.me/estate_agency"
    whatsapp: Optional[str] = "https://wa.me/79991234567"
    vk: Optional[str] = "https://vk.com/estate_agency"
    youtube: Optional[str] = "https://youtube.com/@estate_agency"
    instagram: Optional[str] = ""
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
    max_messenger: Optional[str] = None

class SiteSettingsResponse(SiteSettingsBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
