from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc
from typing import Optional
from app.database import get_db
from app.models.property import Property
from app.schemas.property import PropertyListResponse, PropertyResponse

router = APIRouter(prefix="/api/v1/properties", tags=["Properties"])

@router.get("/", response_model=PropertyListResponse)
async def list_properties(
    category_id: Optional[int] = Query(None),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    rooms: Optional[int] = Query(None),
    min_area: Optional[float] = Query(None),
    max_area: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Property).where(Property.is_active == True)
    count_query = select(func.count()).select_from(Property).where(Property.is_active == True)

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
    query = select(Property).where(Property.is_active == True, Property.is_featured == True).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Property).where(Property.id == property_id)
    result = await db.execute(query)
    property_obj = result.scalars().first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
        
    return property_obj
