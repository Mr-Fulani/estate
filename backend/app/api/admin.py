from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from app.database import get_db
from app.models.property import Property
from app.models.contact import ContactRequest
from app.models.category import Category

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

class AdminStatsResponse(BaseModel):
    total_properties: int
    active_properties: int
    featured_properties: int
    total_contacts: int
    new_contacts: int
    categories_count: int

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(db: AsyncSession = Depends(get_db)):
    # Total properties
    res_prop = await db.execute(select(func.count(Property.id)))
    total_properties = res_prop.scalar_one()

    # Active properties
    res_active = await db.execute(select(func.count(Property.id)).where(Property.is_active == True))
    active_properties = res_active.scalar_one()

    # Featured properties
    res_feat = await db.execute(select(func.count(Property.id)).where(Property.is_featured == True))
    featured_properties = res_feat.scalar_one()

    # Total contacts
    res_cont = await db.execute(select(func.count(ContactRequest.id)))
    total_contacts = res_cont.scalar_one()

    # New contacts
    res_new = await db.execute(select(func.count(ContactRequest.id)).where(ContactRequest.status == "new"))
    new_contacts = res_new.scalar_one()

    # Categories count
    res_cat = await db.execute(select(func.count(Category.id)))
    categories_count = res_cat.scalar_one()

    return AdminStatsResponse(
        total_properties=total_properties,
        active_properties=active_properties,
        featured_properties=featured_properties,
        total_contacts=total_contacts,
        new_contacts=new_contacts,
        categories_count=categories_count,
    )
