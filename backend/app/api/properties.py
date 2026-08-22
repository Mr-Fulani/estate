from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import selectinload
from typing import Optional
from app.database import get_db
from app.models.property import Property
from app.models.property_translation import PropertyTranslation
from app.schemas.property import PropertyListResponse, PropertyResponse, PropertyCreate, PropertyUpdate
from app.utils.slug import generate_slug
from app.audit import add_audit_log
from app.models.admin_user import AdminUser
from app.security import AuthContext, get_optional_auth_context, has_permission, require_permission

router = APIRouter(prefix="/api/v1/properties", tags=["Properties"])


def sync_property_translations(
    property_obj: Property,
    translations: list[dict],
) -> None:
    """Update existing locale rows in place to avoid unique-key insert races."""
    existing_by_locale = {
        translation.locale: translation for translation in property_obj.translations
    }
    synchronized: list[PropertyTranslation] = []

    for translation_data in translations:
        locale = translation_data["locale"]
        translation = existing_by_locale.get(locale)
        if translation is None:
            translation = PropertyTranslation(**translation_data)
        else:
            for field, value in translation_data.items():
                if field != "locale":
                    setattr(translation, field, value)
        synchronized.append(translation)

    property_obj.translations[:] = synchronized

@router.get("", include_in_schema=False)
@router.get("/", response_model=PropertyListResponse)
async def list_properties(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    rooms: Optional[int] = Query(None),
    min_rooms: Optional[int] = Query(None),
    min_area: Optional[float] = Query(None),
    max_area: Optional[float] = Query(None),
    include_inactive: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    auth_context: AuthContext | None = Depends(get_optional_auth_context),
):
    if include_inactive and (
        auth_context is None or not has_permission(auth_context.user, "properties:write")
    ):
        raise HTTPException(status_code=401, detail="Authentication required")
    query = select(Property).options(
        selectinload(Property.category),
        selectinload(Property.translations),
    )
    count_query = select(func.count()).select_from(Property)

    if not include_inactive:
        query = query.where(Property.is_active == True)
        count_query = count_query.where(Property.is_active == True)

    if search:
        search_filter = or_(
            Property.title.ilike(f"%{search}%"),
            Property.description.ilike(f"%{search}%"),
            Property.city.ilike(f"%{search}%"),
            Property.district.ilike(f"%{search}%"),
            Property.address.ilike(f"%{search}%"),
            Property.translations.any(
                or_(
                    PropertyTranslation.title.ilike(f"%{search}%"),
                    PropertyTranslation.description.ilike(f"%{search}%"),
                    PropertyTranslation.city.ilike(f"%{search}%"),
                    PropertyTranslation.district.ilike(f"%{search}%"),
                    PropertyTranslation.address.ilike(f"%{search}%"),
                )
            ),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if category_id:
        query = query.where(Property.category_id == category_id)
        count_query = count_query.where(Property.category_id == category_id)
    if city:
        city_filter = or_(
            Property.city.ilike(f"%{city}%"),
            Property.translations.any(PropertyTranslation.city.ilike(f"%{city}%")),
        )
        query = query.where(city_filter)
        count_query = count_query.where(city_filter)
    if min_price is not None:
        query = query.where(Property.price >= min_price)
        count_query = count_query.where(Property.price >= min_price)
    if max_price is not None:
        query = query.where(Property.price <= max_price)
        count_query = count_query.where(Property.price <= max_price)
    if rooms is not None:
        query = query.where(Property.rooms == rooms)
        count_query = count_query.where(Property.rooms == rooms)
    if min_rooms is not None:
        query = query.where(Property.rooms >= min_rooms)
        count_query = count_query.where(Property.rooms >= min_rooms)
    if min_area is not None:
        query = query.where(Property.area >= min_area)
        count_query = count_query.where(Property.area >= min_area)
    if max_area is not None:
        query = query.where(Property.area <= max_area)
        count_query = count_query.where(Property.area <= max_area)

    # Sorting
    order_func = desc if order == "desc" else asc
    sort_column = getattr(Property, sort_by, Property.created_at)
    query = query.order_by(order_func(sort_column))

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    result = await db.execute(query)
    items = result.scalars().all()

    return PropertyListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page
    )

@router.get("/featured", response_model=list[PropertyResponse])
async def featured_properties(limit: int = 6, db: AsyncSession = Depends(get_db)):
    query = (
        select(Property)
        .options(selectinload(Property.category), selectinload(Property.translations))
        .where(Property.is_active == True, Property.is_featured == True)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{property_identifier}", response_model=PropertyResponse)
async def get_property(
    property_identifier: str,
    db: AsyncSession = Depends(get_db),
    auth_context: AuthContext | None = Depends(get_optional_auth_context),
):
    identifier_filter = (
        Property.id == int(property_identifier)
        if property_identifier.isdigit()
        else Property.slug == property_identifier
    )
    query = (
        select(Property)
        .options(selectinload(Property.category), selectinload(Property.translations))
        .where(identifier_filter)
    )
    result = await db.execute(query)
    property_obj = result.scalars().first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    if not property_obj.is_active and (
        auth_context is None or not has_permission(auth_context.user, "properties:write")
    ):
        raise HTTPException(status_code=404, detail="Property not found")
        
    return property_obj

@router.post("", include_in_schema=False)
@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    prop_data: PropertyCreate,
    request: Request,
    current: AdminUser = Depends(require_permission("properties:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    data = prop_data.model_dump()
    translations = data.pop("translations", [])
    locales = [translation["locale"] for translation in translations]
    if len(locales) != len(set(locales)):
        raise HTTPException(status_code=422, detail="Each property locale can be provided only once")
    if not data.get("slug"):
        data["slug"] = generate_slug(data["title"], fallback="property")
    status_labels = {"available": "Актуально", "reserved": "В брони", "sold": "Продано", "rented": "Сдано", "archived": "В архиве"}
    if data.get("status_badge") is None:
        data["status_badge"] = status_labels.get(data.get("market_status"), "Актуально")
        
    new_prop = Property(**data)
    new_prop.translations = [PropertyTranslation(**translation) for translation in translations]
    db.add(new_prop)
    await db.flush()
    add_audit_log(
        db, request, current, "property.created", "property", new_prop.id, {"title": new_prop.title}
    )
    await db.commit()

    query = (
        select(Property)
        .options(selectinload(Property.category), selectinload(Property.translations))
        .where(Property.id == new_prop.id)
    )
    result = await db.execute(query)
    return result.scalars().first()

@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: int,
    prop_data: PropertyUpdate,
    request: Request,
    current: AdminUser = Depends(require_permission("properties:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Property)
        .options(selectinload(Property.category), selectinload(Property.translations))
        .where(Property.id == property_id)
    )
    result = await db.execute(query)
    property_obj = result.scalars().first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
        
    update_data = prop_data.model_dump(exclude_unset=True)
    translations = update_data.pop("translations", None)
    if "market_status" in update_data and "status_badge" not in update_data:
        update_data["status_badge"] = {
            "available": "Актуально", "reserved": "В брони", "sold": "Продано",
            "rented": "Сдано", "archived": "В архиве",
        }.get(update_data["market_status"], property_obj.status_badge)
    for field, val in update_data.items():
        setattr(property_obj, field, val)

    if translations is not None:
        locales = [translation["locale"] for translation in translations]
        if len(locales) != len(set(locales)):
            raise HTTPException(status_code=422, detail="Each property locale can be provided only once")
        sync_property_translations(property_obj, translations)

    add_audit_log(
        db,
        request,
        current,
        "property.updated",
        "property",
        property_obj.id,
        {"fields": sorted([*update_data.keys(), *(["translations"] if translations is not None else [])])},
    )
    await db.commit()
    result = await db.execute(query)
    return result.scalars().first()

@router.delete("/{property_id}")
async def delete_property(
    property_id: int,
    request: Request,
    current: AdminUser = Depends(require_permission("properties:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    query = select(Property).where(Property.id == property_id)
    result = await db.execute(query)
    property_obj = result.scalars().first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
        
    add_audit_log(
        db, request, current, "property.deleted", "property", property_obj.id, {"title": property_obj.title}
    )
    await db.delete(property_obj)
    await db.commit()
    return {"success": True, "message": "Property deleted successfully"}
