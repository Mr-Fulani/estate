from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.landing_page import LandingPage
from app.schemas.landing_page import LandingInput, LandingResponse
from app.models.admin_user import AdminUser
from app.security import require_permission
from app.audit import add_audit_log

router = APIRouter(prefix='/api/v1/landing-pages', tags=['Landing pages'])


@router.get('/admin/all', response_model=list[LandingResponse])
async def admin_pages(db: AsyncSession = Depends(get_db), _: AdminUser = Depends(require_permission('news:write'))):
    return (await db.scalars(select(LandingPage).order_by(LandingPage.id))).all()


@router.get('', response_model=list[LandingResponse])
async def public_pages(db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(LandingPage).where(LandingPage.is_published.is_(True)).order_by(LandingPage.id))).all()


@router.get('/{slug}', response_model=LandingResponse)
async def public_page(slug: str, db: AsyncSession = Depends(get_db)):
    page = await db.scalar(select(LandingPage).where(LandingPage.slug == slug, LandingPage.is_published.is_(True)))
    if not page:
        raise HTTPException(404, 'Page not found')
    return page


async def save_page(data, request, current, db, page=None):
    duplicate = await db.scalar(select(LandingPage.id).where(LandingPage.slug == data.slug))
    if duplicate is not None and (page is None or duplicate != page.id):
        raise HTTPException(409, 'Slug is already used')
    if page is not None and data.slug != page.slug:
        raise HTTPException(422, 'Published page identity is immutable; edit its content instead')
    if page is None:
        page = LandingPage()
        db.add(page)
    for key, value in data.model_dump().items():
        setattr(page, key, value)
    await db.flush()
    add_audit_log(db, request, current, 'landing.saved', 'landing_page', page.id, {'slug':page.slug})
    await db.commit()
    await db.refresh(page)
    return page


@router.post('', response_model=LandingResponse, status_code=201)
async def create_page(data: LandingInput, request: Request, db: AsyncSession = Depends(get_db), current: AdminUser = Depends(require_permission('news:write', csrf=True))):
    return await save_page(data, request, current, db)


@router.put('/{page_id}', response_model=LandingResponse)
async def update_page(page_id: int, data: LandingInput, request: Request, db: AsyncSession = Depends(get_db), current: AdminUser = Depends(require_permission('news:write', csrf=True))):
    page = await db.get(LandingPage, page_id)
    if page is None:
        raise HTTPException(404, 'Page not found')
    return await save_page(data, request, current, db, page)
