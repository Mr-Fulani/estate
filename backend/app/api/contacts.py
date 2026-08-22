from datetime import date, datetime, timedelta, timezone
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal, get_db
from app.config import get_settings
from app.models.contact import ContactRequest, LeadActivity
from app.models.property import Property
from app.schemas.contact import (
    ContactCreate,
    ContactResponse,
    ContactTrackCreate,
    ContactUpdate,
    ContactWebhookCreate,
    LeadNoteCreate,
)
from app.audit import add_audit_log
from app.models.admin_user import AdminUser
from app.security import require_permission
from app.services.currency import convert_amount_to_rub, get_exchange_rates
from app.rate_limit import enforce_rate_limit


router = APIRouter(prefix="/api/v1/contacts", tags=["Contacts"])
settings = get_settings()


PROPERTY_CLOSED_BADGES = {"sold": "Продано", "rented": "Сдано"}
PROPERTY_DEFAULT_BADGES = {
    "available": "Актуально",
    "reserved": "В брони",
    "sold": "Продано",
    "rented": "Сдано",
    "archived": "В архиве",
}


def _lead_query(for_update: bool = False):
    query = select(ContactRequest).options(
        selectinload(ContactRequest.property),
        selectinload(ContactRequest.activities),
    )
    if for_update:
        query = query.with_for_update().execution_options(populate_existing=True)
    return query


async def _get_lead(
    contact_id: int,
    db: AsyncSession,
    *,
    for_update: bool = False,
) -> ContactRequest:
    result = await db.execute(
        _lead_query(for_update=for_update).where(ContactRequest.id == contact_id)
    )
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Contact request not found")
    return lead


async def _lock_property(property_id: int, db: AsyncSession) -> Property:
    result = await db.execute(
        select(Property).where(Property.id == property_id).with_for_update()
    )
    property_record = result.scalar_one_or_none()
    if property_record is None:
        raise HTTPException(status_code=422, detail="Linked property no longer exists")
    return property_record


async def _find_other_won_deal(
    property_id: int,
    contact_id: int,
    db: AsyncSession,
) -> ContactRequest | None:
    result = await db.execute(
        select(ContactRequest)
        .where(
            ContactRequest.property_id == property_id,
            ContactRequest.status == "won",
            ContactRequest.id != contact_id,
        )
        .order_by(ContactRequest.closed_at.desc(), ContactRequest.id.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _deal_conversion(
    amount: float | None,
    currency: str,
) -> tuple[float | None, float | None, date | None]:
    if amount is None:
        return None, None, None

    normalized_currency = currency.upper()
    if normalized_currency == "RUB":
        converted, rate = convert_amount_to_rub(amount, normalized_currency, {"RUB": 1.0})
        return float(converted), float(rate), date.today()

    try:
        async with AsyncSessionLocal() as rate_db:
            snapshot, _ = await get_exchange_rates(rate_db)
            rates = dict(snapshot.rates)
            effective_date = snapshot.effective_date
        converted, rate = convert_amount_to_rub(amount, normalized_currency, rates)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Official exchange rate is unavailable; the deal was not closed",
        ) from exc
    return float(converted), float(rate), effective_date


async def _restore_property_after_won(
    lead: ContactRequest,
    property_record: Property,
    db: AsyncSession,
) -> None:
    other_won = await _find_other_won_deal(property_record.id, lead.id, db)
    if other_won and other_won.outcome in PROPERTY_CLOSED_BADGES:
        property_record.market_status = other_won.outcome
        property_record.status_badge = PROPERTY_CLOSED_BADGES[other_won.outcome]
    else:
        restored_status = lead.previous_property_market_status or "available"
        property_record.market_status = restored_status
        if lead.previous_property_market_status is not None:
            property_record.status_badge = lead.previous_property_status_badge
        else:
            property_record.status_badge = PROPERTY_DEFAULT_BADGES.get(restored_status)

    lead.previous_property_market_status = None
    lead.previous_property_status_badge = None


@router.get("", include_in_schema=False)
@router.get("/", response_model=list[ContactResponse])
async def list_contacts(
    status_filter: Optional[str] = Query(None, alias="status"),
    channel: Optional[str] = Query(None),
    property_id: Optional[int] = Query(None),
    _: AdminUser = Depends(require_permission("leads:view")),
    db: AsyncSession = Depends(get_db),
):
    query = _lead_query().order_by(desc(ContactRequest.created_at))
    if status_filter:
        query = query.where(ContactRequest.status == status_filter)
    if channel:
        query = query.where(ContactRequest.channel == channel)
    if property_id:
        query = query.where(ContactRequest.property_id == property_id)
    result = await db.execute(query)
    return result.scalars().unique().all()


@router.post("", include_in_schema=False)
@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact: ContactCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await enforce_rate_limit(
        request,
        action="contact_form",
        limit=settings.PUBLIC_FORM_RATE_LIMIT,
        window_minutes=settings.PUBLIC_RATE_WINDOW_MINUTES,
    )
    new_contact = ContactRequest(
        **contact.model_dump(exclude={"website"}),
        status="new",
        is_read=False,
    )
    db.add(new_contact)
    await db.flush()
    db.add(
        LeadActivity(
            contact_id=new_contact.id,
            event_type="lead_created",
            to_status="new",
            event_data={"kind": "form", "channel": "form", "source": contact.source},
        )
    )
    await db.commit()
    return await _get_lead(new_contact.id, db)


@router.post("/track", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def track_contact_action(
    event: ContactTrackCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Record a high-intent contact click without claiming that a message was delivered."""
    await enforce_rate_limit(
        request,
        action="contact_tracking",
        limit=settings.PUBLIC_TRACK_RATE_LIMIT,
        window_minutes=settings.PUBLIC_RATE_WINDOW_MINUTES,
    )
    existing = None
    if event.session_id:
        dedupe_after = datetime.now(timezone.utc) - timedelta(minutes=30)
        result = await db.execute(
            _lead_query()
            .where(
                ContactRequest.kind == "click",
                ContactRequest.session_id == event.session_id,
                ContactRequest.channel == event.channel,
                ContactRequest.property_id == event.property_id,
                ContactRequest.created_at >= dedupe_after,
            )
            .order_by(desc(ContactRequest.created_at))
        )
        existing = result.scalars().first()

    if existing:
        db.add(
            LeadActivity(
                contact_id=existing.id,
                event_type="contact_click_repeated",
                to_status=existing.status,
                event_data={"channel": event.channel, "source": event.source},
            )
        )
        await db.commit()
        return await _get_lead(existing.id, db)

    new_contact = ContactRequest(
        **event.model_dump(),
        status="new",
        is_read=False,
        message=f"Переход в канал связи: {event.channel}",
    )
    db.add(new_contact)
    await db.flush()
    db.add(
        LeadActivity(
            contact_id=new_contact.id,
            event_type="contact_click",
            to_status="new",
            event_data={"channel": event.channel, "source": event.source},
        )
    )
    await db.commit()
    return await _get_lead(new_contact.id, db)


@router.post("/webhook", response_model=ContactResponse)
async def ingest_messenger_message(
    payload: ContactWebhookCreate,
    x_crm_webhook_secret: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Receive confirmed messenger messages from an authorized provider connector."""
    if not settings.CRM_WEBHOOK_SECRET or not secrets.compare_digest(
        x_crm_webhook_secret, settings.CRM_WEBHOOK_SECRET
    ):
        raise HTTPException(status_code=401, detail="Invalid CRM webhook secret")

    if payload.external_message_id:
        existing_contact_id = await db.scalar(
            select(LeadActivity.contact_id).where(
                LeadActivity.event_type == "messenger_message",
                LeadActivity.external_message_id == payload.external_message_id,
            )
        )
        if existing_contact_id is not None:
            return await _get_lead(existing_contact_id, db)

    result = await db.execute(
        _lead_query()
        .where(
            ContactRequest.channel == payload.channel,
            ContactRequest.external_conversation_id == payload.external_conversation_id,
        )
        .order_by(desc(ContactRequest.created_at))
    )
    lead = result.scalars().first()
    if not lead:
        lead = ContactRequest(
            kind="webhook",
            channel=payload.channel,
            source=payload.source,
            external_conversation_id=payload.external_conversation_id,
            external_username=payload.external_username,
            name=payload.name,
            email=str(payload.email) if payload.email else None,
            phone=payload.phone,
            message=payload.message,
            property_id=payload.property_id,
            locale=payload.locale,
            status="new",
            is_read=False,
        )
        db.add(lead)
        await db.flush()
    else:
        lead.kind = "webhook"
        lead.is_read = False
        lead.message = payload.message
        lead.name = payload.name or lead.name
        lead.email = str(payload.email) if payload.email else lead.email
        lead.phone = payload.phone or lead.phone
        lead.external_username = payload.external_username or lead.external_username
        lead.property_id = payload.property_id or lead.property_id

    db.add(
        LeadActivity(
            contact_id=lead.id,
            event_type="messenger_message",
            to_status=lead.status,
            note=payload.message,
            external_message_id=payload.external_message_id,
            event_data={
                "channel": payload.channel,
                "external_message_id": payload.external_message_id,
                "external_username": payload.external_username,
            },
        )
    )
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        if payload.external_message_id:
            existing_contact_id = await db.scalar(
                select(LeadActivity.contact_id).where(
                    LeadActivity.event_type == "messenger_message",
                    LeadActivity.external_message_id == payload.external_message_id,
                )
            )
            if existing_contact_id is not None:
                return await _get_lead(existing_contact_id, db)
        raise
    return await _get_lead(lead.id, db)


@router.patch("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: int,
    update: ContactUpdate,
    request: Request,
    current: AdminUser = Depends(require_permission("leads:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    initial_lead = await _get_lead(contact_id, db)
    data = update.model_dump(exclude_unset=True)
    note = data.pop("note", None)
    initial_next_status = data.get("status", initial_lead.status)
    initial_next_outcome = data.get("outcome", initial_lead.outcome)
    raw_initial_deal_value = data.get("deal_value", initial_lead.deal_value)
    initial_deal_value = (
        float(raw_initial_deal_value) if raw_initial_deal_value is not None else None
    )
    initial_currency = str(data.get("deal_currency", initial_lead.deal_currency))

    if initial_next_status == "won":
        if not initial_lead.property_id:
            raise HTTPException(status_code=422, detail="A won deal must be linked to a property")
        if initial_next_outcome not in PROPERTY_CLOSED_BADGES:
            raise HTTPException(status_code=422, detail="Select sold or rented for a won deal")

    should_prepare_conversion = initial_next_status == "won" and (
        initial_lead.status != "won"
        or "deal_value" in data
        or "deal_currency" in data
        or initial_lead.deal_value_rub is None
    )
    prepared_conversion = (
        await _deal_conversion(initial_deal_value, initial_currency)
        if should_prepare_conversion
        else None
    )

    lead = await _get_lead(contact_id, db, for_update=True)
    old_status = lead.status
    next_status = data.get("status", old_status)
    next_outcome = data.get("outcome", lead.outcome)

    if next_status == "won":
        if not lead.property_id:
            raise HTTPException(status_code=422, detail="A won deal must be linked to a property")
        if next_outcome not in PROPERTY_CLOSED_BADGES:
            raise HTTPException(status_code=422, detail="Select sold or rented for a won deal")

    for field, value in data.items():
        setattr(lead, field, value)
    lead.is_read = True

    property_record = (
        await _lock_property(lead.property_id, db) if lead.property_id is not None else None
    )
    if next_status == "won" and property_record is not None:
        conflict = await _find_other_won_deal(property_record.id, lead.id, db)
        if conflict is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This property already has another successful deal",
            )

    now = datetime.now(timezone.utc)
    if next_status in {"won", "lost"} and next_status != old_status:
        lead.closed_at = now
    elif next_status not in {"won", "lost"}:
        lead.closed_at = None

    if old_status == "won" and next_status != "won" and property_record is not None:
        await _restore_property_after_won(lead, property_record, db)

    if next_status == "won" and property_record is not None:
        if old_status != "won":
            lead.previous_property_market_status = property_record.market_status
            lead.previous_property_status_badge = property_record.status_badge
        property_record.market_status = next_outcome
        property_record.status_badge = PROPERTY_CLOSED_BADGES[next_outcome]

        should_update_conversion = (
            old_status != "won"
            or "deal_value" in data
            or "deal_currency" in data
            or lead.deal_value_rub is None
        )
        if should_update_conversion:
            final_amount = float(lead.deal_value) if lead.deal_value is not None else None
            final_currency = lead.deal_currency
            if (
                prepared_conversion is None
                or initial_deal_value != final_amount
                or initial_currency != final_currency
            ):
                prepared_conversion = await _deal_conversion(final_amount, final_currency)
            (
                lead.deal_value_rub,
                lead.deal_exchange_rate,
                lead.deal_rate_effective_date,
            ) = prepared_conversion
    else:
        lead.outcome = None
        lead.deal_value = None
        lead.deal_value_rub = None
        lead.deal_exchange_rate = None
        lead.deal_rate_effective_date = None

    if (
        next_status != old_status
        or "outcome" in data
        or "deal_value" in data
        or "deal_currency" in data
    ):
        db.add(
            LeadActivity(
                contact_id=lead.id,
                event_type="status_changed" if next_status != old_status else "deal_updated",
                from_status=old_status,
                to_status=next_status,
                event_data={
                    "outcome": lead.outcome,
                    "deal_value": float(lead.deal_value) if lead.deal_value is not None else None,
                    "deal_currency": lead.deal_currency,
                    "deal_value_rub": float(lead.deal_value_rub) if lead.deal_value_rub is not None else None,
                    "deal_exchange_rate": float(lead.deal_exchange_rate) if lead.deal_exchange_rate is not None else None,
                    "deal_rate_effective_date": lead.deal_rate_effective_date.isoformat() if lead.deal_rate_effective_date else None,
                },
            )
        )
    if note:
        db.add(LeadActivity(contact_id=lead.id, event_type="note_added", note=note, to_status=next_status))

    add_audit_log(
        db,
        request,
        current,
        "lead.updated",
        "contact",
        lead.id,
        {
            "fields": sorted([*data.keys(), *(["note"] if note else [])]),
            "from_status": old_status,
            "to_status": next_status,
            "outcome": lead.outcome,
        },
    )
    await db.commit()
    return await _get_lead(contact_id, db)


@router.patch("/{contact_id}/status", response_model=ContactResponse)
async def update_contact_status(
    contact_id: int,
    request: Request,
    new_status: str = Query(...),
    current: AdminUser = Depends(require_permission("leads:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    if new_status not in {"new", "contacted", "qualified", "viewing", "negotiation", "lost"}:
        raise HTTPException(status_code=422, detail="Use the deal update endpoint to close a won deal")
    return await update_contact(contact_id, ContactUpdate(status=new_status), request, current, db)


@router.post("/{contact_id}/notes", response_model=ContactResponse)
async def add_contact_note(
    contact_id: int,
    payload: LeadNoteCreate,
    request: Request,
    current: AdminUser = Depends(require_permission("leads:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    lead = await _get_lead(contact_id, db)
    lead.is_read = True
    db.add(
        LeadActivity(
            contact_id=lead.id,
            event_type="note_added",
            note=payload.note,
            to_status=lead.status,
        )
    )
    add_audit_log(
        db, request, current, "lead.note_added", "contact", lead.id, {"status": lead.status}
    )
    await db.commit()
    return await _get_lead(contact_id, db)


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: int,
    request: Request,
    current: AdminUser = Depends(require_permission("leads:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    lead = await _get_lead(contact_id, db, for_update=True)
    if lead.status == "won" and lead.property_id is not None:
        property_record = await _lock_property(lead.property_id, db)
        await _restore_property_after_won(lead, property_record, db)
    add_audit_log(
        db,
        request,
        current,
        "lead.deleted",
        "contact",
        lead.id,
        {"channel": lead.channel, "status": lead.status},
    )
    await db.delete(lead)
    await db.commit()
    return {"success": True, "message": "Contact request deleted"}
