from datetime import datetime, timezone
from typing import Annotated, cast

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.news import NewsArticle, NewsMedia, NewsTranslation
from app.media_storage import delete_owned_news_files
from app.schemas.news import (
    LocaleCode,
    NewsAdminResponse,
    NewsArticleCreate,
    NewsArticleUpdate,
    NewsListResponse,
    NewsMediaBase,
    NewsPublicResponse,
    NewsTranslationBase,
)
from app.utils.slug import clean_slug, generate_slug
from app.audit import add_audit_log
from app.models.admin_user import AdminUser
from app.security import require_permission


router = APIRouter(prefix="/api/v1/news", tags=["News"])


def _validate_translations(translations: list[NewsTranslationBase]) -> None:
    locales = [translation.locale for translation in translations]
    if len(locales) != len(set(locales)):
        raise HTTPException(status_code=422, detail="Each news locale can be provided only once")
    if "ru" not in locales:
        raise HTTPException(status_code=422, detail="Russian translation is required")


def _sync_translations(article: NewsArticle, translations: list[NewsTranslationBase]) -> None:
    incoming = {item.locale: item for item in translations}
    article.translations[:] = [
        translation for translation in article.translations if translation.locale in incoming
    ]
    existing = {translation.locale: translation for translation in article.translations}

    for locale, item in incoming.items():
        values = item.model_dump(exclude={"locale"})
        translation = existing.get(locale)
        if translation is None:
            article.translations.append(NewsTranslation(locale=locale, **values))
            continue
        for field, value in values.items():
            setattr(translation, field, value)


def _sync_media(article: NewsArticle, media: list[NewsMediaBase]) -> None:
    for index, item in enumerate(media):
        current = article.media[index] if index < len(article.media) else None
        if current is None:
            current = NewsMedia()
            article.media.append(current)
        current.media_type = item.media_type
        current.url = item.url
        current.position = index

    while len(article.media) > len(media):
        article.media.pop()


def _public_article(article: NewsArticle, locale: LocaleCode) -> NewsPublicResponse:
    by_locale = {translation.locale: translation for translation in article.translations}
    translation = by_locale.get(locale) or by_locale.get("ru")
    if translation is None:
        raise HTTPException(status_code=500, detail="News translation is missing")

    resolved_locale = cast(LocaleCode, translation.locale)
    return NewsPublicResponse(
        id=article.id,
        slug=article.slug,
        locale=resolved_locale,
        title=translation.title,
        excerpt=translation.excerpt,
        content=translation.content,
        meta_title=translation.meta_title,
        meta_description=translation.meta_description,
        cover_image=article.cover_image,
        author=article.author,
        published_at=article.published_at,
        media=article.media,
        available_locales=[
            candidate
            for candidate in ("ru", "en", "tr")
            if candidate in by_locale
        ],
    )


async def _load_article(db: AsyncSession, article_id: int) -> NewsArticle | None:
    result = await db.execute(
        select(NewsArticle)
        .options(selectinload(NewsArticle.translations), selectinload(NewsArticle.media))
        .where(NewsArticle.id == article_id)
    )
    return result.scalars().first()


@router.get("/admin/all", response_model=list[NewsAdminResponse])
async def list_all_news(
    _: AdminUser = Depends(require_permission("news:write")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NewsArticle)
        .options(selectinload(NewsArticle.translations), selectinload(NewsArticle.media))
        .order_by(NewsArticle.created_at.desc())
    )
    return result.scalars().all()


@router.get("/admin/{article_id}", response_model=NewsAdminResponse)
async def get_news_for_admin(
    article_id: int,
    _: AdminUser = Depends(require_permission("news:write")),
    db: AsyncSession = Depends(get_db),
):
    article = await _load_article(db, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="News article not found")
    return article


@router.get("", include_in_schema=False)
@router.get("/", response_model=NewsListResponse)
async def list_news(
    locale: LocaleCode = Query("ru"),
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=50)] = 9,
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    published_filter = (
        (NewsArticle.is_published.is_(True))
        & or_(NewsArticle.published_at.is_(None), NewsArticle.published_at <= now)
    )
    total = (
        await db.execute(select(func.count(NewsArticle.id)).where(published_filter))
    ).scalar_one()
    result = await db.execute(
        select(NewsArticle)
        .options(selectinload(NewsArticle.translations), selectinload(NewsArticle.media))
        .where(published_filter)
        .order_by(func.coalesce(NewsArticle.published_at, NewsArticle.created_at).desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    articles = result.scalars().all()
    return NewsListResponse(
        items=[_public_article(article, locale) for article in articles],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{slug}", response_model=NewsPublicResponse)
async def get_news(slug: str, locale: LocaleCode = Query("ru"), db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(NewsArticle)
        .options(selectinload(NewsArticle.translations), selectinload(NewsArticle.media))
        .where(
            NewsArticle.slug == slug,
            NewsArticle.is_published.is_(True),
            or_(NewsArticle.published_at.is_(None), NewsArticle.published_at <= now),
        )
    )
    article = result.scalars().first()
    if article is None:
        raise HTTPException(status_code=404, detail="News article not found")
    return _public_article(article, locale)


@router.post("", include_in_schema=False)
@router.post("/", response_model=NewsAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_news(
    data: NewsArticleCreate,
    request: Request,
    current: AdminUser = Depends(require_permission("news:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    _validate_translations(data.translations)
    russian = next(item for item in data.translations if item.locale == "ru")
    slug = clean_slug(data.slug or "") or generate_slug(russian.title, fallback="news")
    if (await db.execute(select(NewsArticle.id).where(NewsArticle.slug == slug))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="News slug already exists")

    published_at = data.published_at
    if data.is_published and published_at is None:
        published_at = datetime.now(timezone.utc)

    article = NewsArticle(
        slug=slug,
        cover_image=data.cover_image,
        author=data.author,
        is_published=data.is_published,
        published_at=published_at,
        translations=[NewsTranslation(**item.model_dump()) for item in data.translations],
        media=[NewsMedia(**item.model_dump()) for item in data.media],
    )
    db.add(article)
    await db.flush()
    add_audit_log(
        db, request, current, "news.created", "news", article.id, {"slug": article.slug}
    )
    await db.commit()
    created = await _load_article(db, article.id)
    if created is None:
        raise HTTPException(status_code=500, detail="Created news article could not be loaded")
    return created


@router.put("/{article_id}", response_model=NewsAdminResponse)
async def update_news(
    article_id: int,
    data: NewsArticleUpdate,
    request: Request,
    current: AdminUser = Depends(require_permission("news:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    article = await _load_article(db, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="News article not found")

    previous_media_urls = {article.cover_image, *(item.url for item in article.media)}

    update_data = data.model_dump(exclude_unset=True, exclude={"translations", "media"})
    if "slug" in update_data:
        candidate = clean_slug(update_data["slug"] or "")
        if not candidate:
            raise HTTPException(status_code=422, detail="News slug cannot be empty")
        duplicate = (
            await db.execute(
                select(NewsArticle.id).where(NewsArticle.slug == candidate, NewsArticle.id != article_id)
            )
        ).scalar_one_or_none()
        if duplicate:
            raise HTTPException(status_code=409, detail="News slug already exists")
        update_data["slug"] = candidate

    if update_data.get("is_published") is True and "published_at" not in update_data and article.published_at is None:
        update_data["published_at"] = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(article, field, value)

    if data.translations is not None:
        _validate_translations(data.translations)
        _sync_translations(article, data.translations)
    if data.media is not None:
        _sync_media(article, data.media)

    add_audit_log(
        db,
        request,
        current,
        "news.updated",
        "news",
        article.id,
        {
            "fields": sorted(
                [
                    *update_data.keys(),
                    *(["translations"] if data.translations is not None else []),
                    *(["media"] if data.media is not None else []),
                ]
            )
        },
    )
    await db.commit()
    retained_media_urls = {article.cover_image, *(item.url for item in article.media)}
    await delete_owned_news_files(previous_media_urls - retained_media_urls)
    updated = await _load_article(db, article.id)
    if updated is None:
        raise HTTPException(status_code=500, detail="Updated news article could not be loaded")
    return updated


@router.delete("/{article_id}")
async def delete_news(
    article_id: int,
    request: Request,
    current: AdminUser = Depends(require_permission("news:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    article = await _load_article(db, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="News article not found")
    media_urls = {article.cover_image, *(item.url for item in article.media)}
    add_audit_log(
        db, request, current, "news.deleted", "news", article.id, {"slug": article.slug}
    )
    await db.delete(article)
    await db.commit()
    await delete_owned_news_files(media_urls)
    return {"success": True}
