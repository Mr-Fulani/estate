from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.settings import SiteSetting
from app.schemas.settings import SiteSettingsUpdate, SiteSettingsResponse
from app.audit import add_audit_log
from app.models.admin_user import AdminUser
from app.security import require_permission

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

async def get_or_create_settings(db: AsyncSession) -> SiteSetting:
    res = await db.execute(select(SiteSetting).where(SiteSetting.id == 1))
    setting = res.scalar_one_or_none()
    if not setting:
        setting = SiteSetting(
            id=1,
            phone="+90 (552) 123-00-00",
            email="support@estate-agency.ru",
            address="г. Стамбул, Бейликдюзю",
            working_hours="Ежедневно с 9:00 до 21:00",
            telegram="https://t.me/estate_agency",
            whatsapp="https://wa.me/905521230000",
            vk="",
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
async def update_settings(
    data: SiteSettingsUpdate,
    request: Request,
    current: AdminUser = Depends(require_permission("settings:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    setting = await get_or_create_settings(db)
    
    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(setting, field, value)

    add_audit_log(
        db,
        request,
        current,
        "settings.updated",
        "site_settings",
        setting.id,
        {"fields": sorted(update_dict.keys())},
    )
    await db.commit()
    await db.refresh(setting)
    return setting
