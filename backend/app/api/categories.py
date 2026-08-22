from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.category import Category, CategoryTranslation
from app.schemas.category import CategoryResponse, CategoryCreate
from app.audit import add_audit_log
from app.models.admin_user import AdminUser
from app.security import require_permission

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
async def create_category(
    cat_data: CategoryCreate,
    request: Request,
    current: AdminUser = Depends(require_permission("categories:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    data = cat_data.model_dump()
    translations = data.pop("translations", [])
    locales = [item["locale"] for item in translations]
    if len(locales) != len(set(locales)):
        raise HTTPException(status_code=422, detail="Each category locale can be provided only once")
    if "ru" not in locales:
        translations.append({
            "locale": "ru",
            "name": data["name"],
            "description": data.get("description"),
        })
    new_cat = Category(**data)
    new_cat.translations = [CategoryTranslation(**item) for item in translations]
    db.add(new_cat)
    await db.flush()
    add_audit_log(
        db, request, current, "category.created", "category", new_cat.id, {"name": new_cat.name}
    )
    await db.commit()
    await db.refresh(new_cat)
    await db.refresh(new_cat, attribute_names=["translations"])
    return new_cat

@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    request: Request,
    current: AdminUser = Depends(require_permission("categories:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    query = select(Category).where(Category.id == category_id)
    result = await db.execute(query)
    category = result.scalars().first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    add_audit_log(
        db, request, current, "category.deleted", "category", category.id, {"name": category.name}
    )
    await db.delete(category)
    await db.commit()
    return {"success": True, "message": "Category deleted"}
