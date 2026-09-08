from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.property import Property
from app.models.property_translation import PropertyTranslation
from app.models.news import NewsArticle, NewsTranslation
from app.models.landing_page import LandingPage
from app.site_runtime import site_runtime

router = APIRouter(prefix='/api/v1/seo', tags=['SEO'])


def has_text(column):
    return func.length(func.trim(func.coalesce(column, ''))) > 0


async def sitemap_items(db, active):
    items = []
    visible = and_(Property.is_active.is_(True), Property.market_status != 'archived', Property.development['is_demo'].as_boolean().is_not(True))
    translations = (await db.execute(select(PropertyTranslation.property_id, PropertyTranslation.locale).join(Property, Property.id == PropertyTranslation.property_id).where(visible, PropertyTranslation.locale.in_(active), has_text(PropertyTranslation.title), has_text(PropertyTranslation.description)))).all()
    by_property = {}
    for identity, locale in translations:
        by_property.setdefault(identity, set()).add(locale)
    properties = (await db.execute(select(Property.id, Property.slug, Property.content_locale, Property.updated_at, Property.created_at, and_(has_text(Property.title),has_text(Property.description)).label('complete')).where(visible).order_by(Property.id))).all()
    for prop in properties:
        languages = by_property.get(prop.id, set())
        if prop.complete and prop.content_locale in active:
            languages.add(prop.content_locale)
        if languages:
            items.append({'path':f'/properties/{prop.slug}','locales':[locale for locale in active if locale in languages],'last_modified':prop.updated_at or prop.created_at})

    published = and_(NewsArticle.is_published.is_(True),or_(NewsArticle.published_at.is_(None),NewsArticle.published_at <= datetime.now(timezone.utc)))
    translations = (await db.execute(select(NewsTranslation.article_id,NewsTranslation.locale).join(NewsArticle,NewsArticle.id==NewsTranslation.article_id).where(published, NewsTranslation.locale.in_(active),has_text(NewsTranslation.title),has_text(NewsTranslation.excerpt),has_text(NewsTranslation.content)))).all()
    by_article = {}
    for identity, locale in translations:
        by_article.setdefault(identity,set()).add(locale)
    articles = (await db.execute(select(NewsArticle.id,NewsArticle.slug,NewsArticle.updated_at,NewsArticle.published_at,NewsArticle.created_at).where(published).order_by(NewsArticle.id))).all()
    for article in articles:
        languages=by_article.get(article.id,set())
        if languages:
            modified=max(value for value in [article.updated_at,article.published_at,article.created_at] if value)
            items.append({'path':f'/news/{article.slug}','locales':[locale for locale in active if locale in languages],'last_modified':modified})

    flags=[and_(*[has_text(LandingPage.translations[locale][key].astext) for key in ['title','description','content']]).label(locale) for locale in active]
    pages=(await db.execute(select(LandingPage.slug,LandingPage.updated_at,*flags).where(LandingPage.is_published.is_(True)).order_by(LandingPage.id))).all()
    for page in pages:
        languages=[locale for locale in active if page._mapping[locale]]
        if languages:
            items.append({'path':f'/collections/{page.slug}','locales':languages,'last_modified':page.updated_at})
    return {'items':items}


@router.get('/sitemap')
async def sitemap_snapshot(db: AsyncSession = Depends(get_db)):
    # All projections see the same catalog, even while an editor publishes or removes content.
    await db.connection(execution_options={'isolation_level':'REPEATABLE READ'})
    return await sitemap_items(db,site_runtime()['locales'])
