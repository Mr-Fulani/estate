from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryResponse

router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])

@router.get("/", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    query = select(Category)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Category).where(Category.id == category_id)
    result = await db.execute(query)
    category = result.scalars().first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    return category
