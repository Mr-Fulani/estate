import re
from fastapi import HTTPException
from sqlalchemy import select, text


def validate_public_slug(value: str) -> str:
    if not isinstance(value, str) or len(value) > 220 or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', value) or value.isdigit() or value in {'admin','featured','all'}:
        raise ValueError('Slug must use lowercase Latin letters, digits and hyphens; numeric and reserved slugs are not allowed')
    return value


async def ensure_slug_available(db, model, alias_model, slug: str, resource_id: int | None = None):
    # Reserve the name across current URLs and history for concurrent writers.
    await db.execute(text('SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))'), {'key':f'{model.__tablename__}:{slug}'})
    current = await db.scalar(select(model.id).where(model.slug == slug))
    previous = await db.scalar(select(alias_model.resource_id).where(alias_model.slug == slug))
    if any(owner is not None and owner != resource_id for owner in (current, previous)):
        raise HTTPException(409, 'Slug is already used or reserved by URL history')


async def remember_slug(db, alias_model, slug: str, resource_id: int):
    existing = await db.get(alias_model, slug)
    if existing is None:
        db.add(alias_model(slug=slug, resource_id=resource_id))
    elif existing.resource_id != resource_id:
        raise HTTPException(409, 'Previous slug belongs to another resource')
