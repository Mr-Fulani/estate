from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryResponse, CategoryCreate

router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])

@router.get("", include_in_schema=False)
@router.get("/", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    query = select(Category).order_by(Category.id)
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

@router.post("", include_in_schema=False)
@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(cat_data: CategoryCreate, db: AsyncSession = Depends(get_db)):
    new_cat = Category(**cat_data.model_dump())
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)
    return new_cat

@router.delete("/{category_id}")
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Category).where(Category.id == category_id)
    result = await db.execute(query)
    category = result.scalars().first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    await db.delete(category)
    await db.commit()
    return {"success": True, "message": "Category deleted"}
