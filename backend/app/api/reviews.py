from datetime import datetime, timedelta, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.contact import ContactRequest
from app.models.property import Property
from app.models.review import Review, ReviewTranslation
from app.schemas.review import (
    ReviewAdminResponse,
    ReviewAdminUpdate,
    ReviewInvitationAdminResponse,
    ReviewInvitationCreate,
    ReviewInvitationPublicResponse,
    ReviewInvitationSubmit,
    ReviewListResponse,
    ReviewPublicCreate,
    ReviewPublicResponse,
    ReviewSubmissionResponse,
)
from app.audit import add_audit_log
from app.models.admin_user import AdminUser
from app.security import hash_token, require_permission
from app.config import get_settings
from app.rate_limit import enforce_rate_limit


router = APIRouter(prefix="/api/v1/reviews", tags=["Reviews"])
settings = get_settings()


def _sync_review_translations(review: Review, translations: list[dict]) -> None:
    incoming = {item["locale"]: item for item in translations}
    review.translations[:] = [
        translation for translation in review.translations if translation.locale in incoming
    ]
    existing = {translation.locale: translation for translation in review.translations}
    for locale, item in incoming.items():
        values = {field: value for field, value in item.items() if field != "locale"}
        translation = existing.get(locale)
        if translation is None:
            review.translations.append(ReviewTranslation(locale=locale, **values))
            continue
        for field, value in values.items():
            setattr(translation, field, value)


def _review_query():
    return select(Review).options(
        selectinload(Review.translations),
        selectinload(Review.property),
        selectinload(Review.contact),
    )


async def _get_review(review_id: int, db: AsyncSession) -> Review:
    result = await db.execute(_review_query().where(Review.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


def _public_review(review: Review, locale: str) -> ReviewPublicResponse:
    translation = next((item for item in review.translations if item.locale == locale), None)
    translation = translation or next((item for item in review.translations if item.locale == review.source_locale), None)
    translation = translation or next((item for item in review.translations if item.locale == "ru"), None)
    translation = translation or (review.translations[0] if review.translations else None)
    if not translation or not review.reviewer_name or review.rating is None:
        raise ValueError("Published review is incomplete")
    return ReviewPublicResponse(
        id=review.id,
        reviewer_name=review.reviewer_name,
        rating=review.rating,
        locale=translation.locale,
        content=translation.content,
        reviewer_role=translation.reviewer_role,
        company_response=translation.company_response,
        is_verified=review.is_verified,
        property_title=review.property.title if review.property else None,
        published_at=review.published_at,
    )


@router.get("", include_in_schema=False)
@router.get("/", response_model=ReviewListResponse)
async def list_reviews(
    locale: str = Query("ru", pattern="^(ru|en|tr)$"),
    featured: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    filters = [Review.status == "published"]
    if featured:
        filters.append(Review.is_featured == True)
    total = (await db.execute(select(func.count(Review.id)).where(*filters))).scalar_one()
    result = await db.execute(
        _review_query()
        .where(*filters)
        .order_by(Review.display_order.asc(), desc(Review.published_at), desc(Review.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    items = [_public_review(review, locale) for review in result.scalars().all()]
    return ReviewListResponse(items=items, total=total, page=page, per_page=per_page)


@router.post("", include_in_schema=False)
@router.post("/", response_model=ReviewSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_review(
    payload: ReviewPublicCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await enforce_rate_limit(
        request,
        action="review_submission",
        limit=settings.PUBLIC_REVIEW_RATE_LIMIT,
        window_minutes=settings.PUBLIC_REVIEW_RATE_WINDOW_MINUTES,
    )
    if payload.website:
        raise HTTPException(status_code=422, detail="Invalid submission")
    if payload.property_id:
        exists = await db.scalar(select(Property.id).where(Property.id == payload.property_id))
        if not exists:
            raise HTTPException(status_code=422, detail="Property not found")

    recent_after = datetime.now(timezone.utc) - timedelta(hours=1)
    duplicate_filter = []
    if payload.email:
        duplicate_filter.append(Review.email == str(payload.email))
    if payload.phone:
        duplicate_filter.append(Review.phone == payload.phone)
    if duplicate_filter:
        duplicate = await db.scalar(
            select(Review.id).where(Review.created_at >= recent_after, or_(*duplicate_filter)).limit(1)
        )
        if duplicate:
            raise HTTPException(status_code=429, detail="Please wait before sending another review")

    review = Review(
        reviewer_name=payload.reviewer_name,
        email=str(payload.email) if payload.email else None,
        phone=payload.phone,
        rating=payload.rating,
        source_locale=payload.locale,
        status="pending",
        is_verified=False,
        property_id=payload.property_id,
        consent_given=True,
        translations=[ReviewTranslation(
            locale=payload.locale,
            content=payload.content,
            reviewer_role=payload.reviewer_role,
        )],
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return ReviewSubmissionResponse(id=review.id, status="pending", is_verified=False)


@router.get("/invitations/{token}", response_model=ReviewInvitationPublicResponse)
async def get_review_invitation(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await enforce_rate_limit(
        request,
        action="review_invitation_lookup",
        limit=settings.PUBLIC_TRACK_RATE_LIMIT,
        window_minutes=settings.PUBLIC_RATE_WINDOW_MINUTES,
    )
    result = await db.execute(
        _review_query().where(Review.invitation_token_hash == hash_token(token))
    )
    review = result.scalars().first()
    now = datetime.now(timezone.utc)
    if not review or review.status != "invited" or not review.invitation_expires_at:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if review.invitation_expires_at < now:
        raise HTTPException(status_code=410, detail="Invitation expired")
    return ReviewInvitationPublicResponse(
        reviewer_name=review.reviewer_name,
        property_title=review.property.title if review.property else None,
        locale=review.source_locale,
        expires_at=review.invitation_expires_at,
    )


@router.post("/invitations/{token}", response_model=ReviewSubmissionResponse)
async def submit_invited_review(
    token: str,
    payload: ReviewInvitationSubmit,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await enforce_rate_limit(
        request,
        action="invited_review_submission",
        limit=settings.PUBLIC_REVIEW_RATE_LIMIT,
        window_minutes=settings.PUBLIC_REVIEW_RATE_WINDOW_MINUTES,
    )
    if payload.website:
        raise HTTPException(status_code=422, detail="Invalid submission")
    result = await db.execute(
        _review_query().where(Review.invitation_token_hash == hash_token(token))
    )
    review = result.scalars().first()
    now = datetime.now(timezone.utc)
    if not review or review.status != "invited" or not review.invitation_expires_at:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if review.invitation_expires_at < now:
        raise HTTPException(status_code=410, detail="Invitation expired")

    review.reviewer_name = payload.reviewer_name
    review.rating = payload.rating
    review.source_locale = payload.locale
    review.status = "pending"
    review.is_verified = True
    review.consent_given = True
    review.invitation_token_hash = None
    review.translations = [ReviewTranslation(
        locale=payload.locale,
        content=payload.content,
        reviewer_role=payload.reviewer_role,
    )]
    await db.commit()
    return ReviewSubmissionResponse(id=review.id, status="pending", is_verified=True)


@router.get("/admin/all", response_model=list[ReviewAdminResponse])
async def list_admin_reviews(
    status_filter: str | None = Query(None, alias="status"),
    _: AdminUser = Depends(require_permission("reviews:write")),
    db: AsyncSession = Depends(get_db),
):
    query = _review_query().order_by(desc(Review.created_at))
    if status_filter:
        query = query.where(Review.status == status_filter)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/admin/invitations/{contact_id}", response_model=ReviewInvitationAdminResponse)
async def create_review_invitation(
    contact_id: int,
    payload: ReviewInvitationCreate,
    request: Request,
    current: AdminUser = Depends(require_permission("reviews:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    contact_result = await db.execute(
        select(ContactRequest)
        .options(selectinload(ContactRequest.property))
        .where(ContactRequest.id == contact_id)
    )
    contact = contact_result.scalars().first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact request not found")
    if contact.status != "won":
        raise HTTPException(status_code=422, detail="Review invitations are available after a won deal")

    existing = await db.scalar(select(Review).where(Review.contact_id == contact_id))
    if existing and existing.status != "invited":
        raise HTTPException(status_code=409, detail="This client has already submitted a review")
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    if existing:
        review = existing
        review.invitation_token_hash = hash_token(token)
        review.invitation_expires_at = expires_at
        review.source_locale = payload.locale
    else:
        review = Review(
            reviewer_name=contact.name,
            email=contact.email,
            phone=contact.phone,
            source_locale=payload.locale,
            status="invited",
            is_verified=True,
            property_id=contact.property_id,
            contact_id=contact.id,
            invitation_token_hash=hash_token(token),
            invitation_expires_at=expires_at,
        )
        db.add(review)
    await db.flush()
    add_audit_log(
        db,
        request,
        current,
        "review.invitation_created",
        "review",
        review.id,
        {"contact_id": contact.id, "locale": payload.locale},
    )
    await db.commit()
    return ReviewInvitationAdminResponse(review=await _get_review(review.id, db), token=token)


@router.put("/admin/{review_id}", response_model=ReviewAdminResponse)
async def update_review(
    review_id: int,
    payload: ReviewAdminUpdate,
    request: Request,
    current: AdminUser = Depends(require_permission("reviews:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    review = await _get_review(review_id, db)
    data = payload.model_dump(exclude_unset=True)
    translations = data.pop("translations", None)
    if translations is not None:
        locales = [item["locale"] for item in translations]
        if len(locales) != len(set(locales)):
            raise HTTPException(status_code=422, detail="Each locale can be provided only once")
        _sync_review_translations(review, translations)
    if data.get("property_id"):
        exists = await db.scalar(select(Property.id).where(Property.id == data["property_id"]))
        if not exists:
            raise HTTPException(status_code=422, detail="Property not found")
    for field, value in data.items():
        setattr(review, field, value)

    if review.status == "published":
        if not review.reviewer_name or review.rating is None or not review.translations:
            raise HTTPException(status_code=422, detail="Complete the author, rating and text before publishing")
        review.published_at = review.published_at or datetime.now(timezone.utc)
    elif "status" in data:
        review.published_at = None
        review.is_featured = False
    add_audit_log(
        db,
        request,
        current,
        "review.updated",
        "review",
        review.id,
        {"fields": sorted([*data.keys(), *(["translations"] if translations is not None else [])])},
    )
    await db.commit()
    return await _get_review(review_id, db)


@router.delete("/admin/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    request: Request,
    current: AdminUser = Depends(require_permission("reviews:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    review = await _get_review(review_id, db)
    add_audit_log(
        db,
        request,
        current,
        "review.deleted",
        "review",
        review.id,
        {"reviewer_name": review.reviewer_name, "status": review.status},
    )
    await db.delete(review)
    await db.commit()
