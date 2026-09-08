from app.models.slug_alias import PropertySlugAlias
from app.services.slug_history import ensure_slug_available, remember_slug
from app.site_runtime import site_runtime
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_, and_, case
from sqlalchemy.orm import selectinload
from typing import Literal, Optional
from app.database import AsyncSessionLocal, get_db
from app.models.property import Property, PropertyUnitType
from app.services.developments import sync_development
from app.services.currency import get_exchange_rates
from app.models.property_translation import PropertyTranslation
from app.schemas.property import PropertyListResponse, PropertyResponse, PropertyCreate, PropertyUpdate
from app.utils.slug import generate_slug
from app.audit import add_audit_log
from app.models.admin_user import AdminUser
from app.security import AuthContext, get_optional_auth_context, has_permission, require_permission

router = APIRouter(prefix="/api/v1/properties", tags=["Properties"])


async def price_multiplier_rub():
    """Convert stored prices to the configured catalog filter currency."""
    try:
        async with AsyncSessionLocal() as rate_db:
            snapshot, _ = await get_exchange_rates(rate_db)
            rates = dict(snapshot.rates)
            target_rate = rates[site_runtime()['catalog_currency']]
            rates = {code: rate / target_rate for code, rate in rates.items()}
        return case(*[(Property.currency == code, rate) for code, rate in rates.items()], else_=None)
    except Exception as exc:
        raise HTTPException(503, "Currency rates are unavailable; try filtering by price later") from exc


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
    transaction_type: Literal["sale", "rent"] | None = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    rooms: Optional[int] = Query(None),
    min_rooms: Optional[int] = Query(None),
    min_area: Optional[float] = Query(None),
    max_area: Optional[float] = Query(None),
    include_inactive: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100),
    sort_by: Literal["created_at", "updated_at", "price", "area", "rooms"] = Query("created_at"),
    order: Literal["asc", "desc"] = Query("desc"),
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

    if transaction_type:
        query = query.where(Property.transaction_type == transaction_type)
        count_query = count_query.where(Property.transaction_type == transaction_type)

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
    multiplier = await price_multiplier_rub() if min_price is not None or max_price is not None or sort_by == "price" else 1
    ordinary, unit_filters = [], []
    for value, property_predicate, unit_predicate in [
        (min_price, lambda v: Property.price * multiplier >= v, lambda v: PropertyUnitType.price_max * multiplier >= v),
        (max_price, lambda v: Property.price * multiplier <= v, lambda v: PropertyUnitType.price_min * multiplier <= v),
        (rooms, lambda v: Property.rooms == v, lambda v: PropertyUnitType.rooms == v),
        (min_rooms, lambda v: Property.rooms >= v, lambda v: PropertyUnitType.rooms >= v),
        (min_area, lambda v: Property.area >= v, lambda v: PropertyUnitType.area_max >= v),
        (max_area, lambda v: Property.area <= v, lambda v: PropertyUnitType.area_min <= v),
    ]:
        if value is not None:
            ordinary.append(property_predicate(value))
            unit_filters.append(unit_predicate(value))
    if ordinary:
        # All filters must match the same apartment type, not different children.
        match = or_(
            and_(Property.listing_kind != "development", *ordinary),
            and_(Property.listing_kind == "development", Property.unit_types.any(and_(*unit_filters))),
        )
        query = query.where(match)
        count_query = count_query.where(match)

    # Sorting
    sort_columns = {
        "created_at": Property.created_at,
        "updated_at": Property.updated_at,
        "price": Property.price * multiplier,
        "area": Property.area,
        "rooms": Property.rooms,
    }
    order_func = desc if order == "desc" else asc
    sort_column = sort_columns[sort_by]
    query = query.order_by(order_func(sort_column), order_func(Property.id))

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
        .order_by(Property.created_at.desc(), Property.id.desc())
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
        else or_(Property.slug == property_identifier, Property.id.in_(select(PropertySlugAlias.resource_id).where(PropertySlugAlias.slug == property_identifier)))
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
    unit_types = data.pop("unit_types", [])
    if prop_data.development is not None:
        data["development"] = prop_data.development.model_dump(mode="json")
    locales = [translation["locale"] for translation in translations]
    if len(locales) != len(set(locales)):
        raise HTTPException(status_code=422, detail="Each property locale can be provided only once")
    if not data.get("slug"):
        data["slug"] = generate_slug(data["title"], fallback="property")
    await ensure_slug_available(db, Property, PropertySlugAlias, data["slug"])
    status_labels = {"available": "Актуально", "reserved": "В брони", "sold": "Продано", "rented": "Сдано", "archived": "В архиве"}
    if data.get("status_badge") is None:
        data["status_badge"] = status_labels.get(data.get("market_status"), "Актуально")
        
    new_prop = Property(**data)
    new_prop.translations = [PropertyTranslation(**translation) for translation in translations]
    new_prop.unit_types = []
    sync_development(new_prop, unit_types)
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
        .where(Property.id == property_id).with_for_update()
    )
    result = await db.execute(query)
    property_obj = result.scalars().first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
        
    update_data = prop_data.model_dump(exclude_unset=True)
    if 'slug' in update_data and update_data['slug'] != property_obj.slug:
        await ensure_slug_available(db, Property, PropertySlugAlias, update_data['slug'], property_obj.id)
        await remember_slug(db, PropertySlugAlias, property_obj.slug, property_obj.id)
    translations = update_data.pop("translations", None)
    unit_types = update_data.pop("unit_types", None)
    if "listing_kind" in update_data and update_data["listing_kind"] is None:
        raise HTTPException(422, "Listing kind cannot be null")
    if prop_data.development is not None:
        update_data["development"] = prop_data.development.model_dump(mode="json")
    if "market_status" in update_data and "status_badge" not in update_data:
        update_data["status_badge"] = {
            "available": "Актуально", "reserved": "В брони", "sold": "Продано",
            "rented": "Сдано", "archived": "В архиве",
        }.get(update_data["market_status"], property_obj.status_badge)
    for field, val in update_data.items():
        setattr(property_obj, field, val)
    sync_development(property_obj, unit_types)

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
        {"fields": sorted([*update_data.keys(), *(["translations"] if translations is not None else []), *(["unit_types"] if unit_types is not None else [])])},
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
