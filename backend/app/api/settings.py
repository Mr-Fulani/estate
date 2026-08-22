from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.settings import SiteSetting, SiteSettingTranslation
from app.schemas.settings import SiteSettingsUpdate, SiteSettingsResponse
from app.audit import add_audit_log
from app.models.admin_user import AdminUser
from app.security import require_permission

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

async def get_or_create_settings(db: AsyncSession) -> SiteSetting:
    res = await db.execute(
        select(SiteSetting)
        .options(selectinload(SiteSetting.translations))
        .where(SiteSetting.id == 1)
    )
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
        setting.translations.append(SiteSettingTranslation(
            locale="ru",
            address=setting.address,
            working_hours=setting.working_hours,
        ))
        db.add(setting)
        await db.commit()
        await db.refresh(setting)
        await db.refresh(setting, attribute_names=["translations"])
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
    translations = update_dict.pop("translations", None)
    for field, value in update_dict.items():
        setattr(setting, field, value)

    if translations is not None:
        locales = [item["locale"] for item in translations]
        if len(locales) != len(set(locales)):
            raise HTTPException(status_code=422, detail="Each settings locale can be provided only once")
        incoming = {item["locale"]: item for item in translations}
        setting.translations[:] = [
            item for item in setting.translations if item.locale in incoming
        ]
        existing = {item.locale: item for item in setting.translations}
        for locale, item in incoming.items():
            translation = existing.get(locale)
            if translation is None:
                translation = SiteSettingTranslation(locale=locale)
                setting.translations.append(translation)
            translation.address = item["address"]
            translation.working_hours = item["working_hours"]

    add_audit_log(
        db,
        request,
        current,
        "settings.updated",
        "site_settings",
        setting.id,
        {"fields": sorted([*update_dict.keys(), *(("translations",) if translations is not None else ())])},
    )
    await db.commit()
    await db.refresh(setting)
    await db.refresh(setting, attribute_names=["translations"])
    return setting
