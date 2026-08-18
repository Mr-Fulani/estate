from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import selectinload
from typing import Optional
import re
import uuid
from app.database import get_db
from app.models.property import Property
from app.schemas.property import PropertyListResponse, PropertyResponse, PropertyCreate, PropertyUpdate

router = APIRouter(prefix="/api/v1/properties", tags=["Properties"])

def generate_slug(title: str) -> str:
    # Transliterate Russian characters to Latin
    translit_dict = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
        'я': 'ya', ' ': '-'
    }
    slug = title.lower()
    for cyr, lat in translit_dict.items():
        slug = slug.replace(cyr, lat)
    slug = re.sub(r'[^a-z0-9\-]', '', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    if not slug:
        slug = f"property-{uuid.uuid4().hex[:8]}"
    else:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"
    return slug

@router.get("", include_in_schema=False)
@router.get("/", response_model=PropertyListResponse)
async def list_properties(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    rooms: Optional[int] = Query(None),
    min_area: Optional[float] = Query(None),
    max_area: Optional[float] = Query(None),
    include_inactive: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Property).options(selectinload(Property.category))
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
            Property.address.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if category_id:
        query = query.where(Property.category_id == category_id)
        count_query = count_query.where(Property.category_id == category_id)
    if city:
        query = query.where(Property.city.ilike(f"%{city}%"))
        count_query = count_query.where(Property.city.ilike(f"%{city}%"))
    if min_price is not None:
        query = query.where(Property.price >= min_price)
        count_query = count_query.where(Property.price >= min_price)
    if max_price is not None:
        query = query.where(Property.price <= max_price)
        count_query = count_query.where(Property.price <= max_price)
    if rooms is not None:
        query = query.where(Property.rooms == rooms)
        count_query = count_query.where(Property.rooms == rooms)
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
    query = select(Property).options(selectinload(Property.category)).where(Property.is_active == True, Property.is_featured == True).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Property).options(selectinload(Property.category)).where(Property.id == property_id)
    result = await db.execute(query)
    property_obj = result.scalars().first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
        
    return property_obj

@router.post("", include_in_schema=False)
@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(prop_data: PropertyCreate, db: AsyncSession = Depends(get_db)):
    data = prop_data.model_dump()
    if not data.get("slug"):
        data["slug"] = generate_slug(data["title"])
        
    new_prop = Property(**data)
    db.add(new_prop)
    await db.commit()
    await db.refresh(new_prop)
    
    # Reload with category relationship
    query = select(Property).options(selectinload(Property.category)).where(Property.id == new_prop.id)
    result = await db.execute(query)
    return result.scalars().first()

@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(property_id: int, prop_data: PropertyUpdate, db: AsyncSession = Depends(get_db)):
    query = select(Property).options(selectinload(Property.category)).where(Property.id == property_id)
    result = await db.execute(query)
    property_obj = result.scalars().first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
        
    update_data = prop_data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(property_obj, field, val)
        
    await db.commit()
    await db.refresh(property_obj)
    
    # Re-fetch with category
    result = await db.execute(query)
    return result.scalars().first()

@router.delete("/{property_id}")
async def delete_property(property_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Property).where(Property.id == property_id)
    result = await db.execute(query)
    property_obj = result.scalars().first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
        
    await db.delete(property_obj)
    await db.commit()
    return {"success": True, "message": "Property deleted successfully"}
