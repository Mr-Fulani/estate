from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.settings import SiteSetting
from app.schemas.settings import SiteSettingsUpdate, SiteSettingsResponse

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

async def get_or_create_settings(db: AsyncSession) -> SiteSetting:
    res = await db.execute(select(SiteSetting).where(SiteSetting.id == 1))
    setting = res.scalar_one_or_none()
    if not setting:
        setting = SiteSetting(
            id=1,
            phone="+7 (495) 123-45-67",
            email="info@estate-agency.ru",
            address="г. Москва, Пресненская набережная, 12, Башня Федерация",
            working_hours="Ежедневно с 9:00 до 21:00",
            telegram="https://t.me/estate_agency",
            whatsapp="https://wa.me/79991234567",
            vk="https://vk.com/estate_agency",
            youtube="https://youtube.com/@estate_agency",
        )
        db.add(setting)
        await db.commit()
        await db.refresh(setting)
    return setting

@router.get("", response_model=SiteSettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    return await get_or_create_settings(db)

@router.put("", response_model=SiteSettingsResponse)
async def update_settings(data: SiteSettingsUpdate, db: AsyncSession = Depends(get_db)):
    setting = await get_or_create_settings(db)
    
    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(setting, field, value)
    
    await db.commit()
    await db.refresh(setting)
    return setting
