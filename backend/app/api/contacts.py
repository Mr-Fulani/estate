from datetime import datetime, timedelta, timezone
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
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


router = APIRouter(prefix="/api/v1/contacts", tags=["Contacts"])
settings = get_settings()


def _lead_query():
    return select(ContactRequest).options(
        selectinload(ContactRequest.property),
        selectinload(ContactRequest.activities),
    )


async def _get_lead(contact_id: int, db: AsyncSession) -> ContactRequest:
    result = await db.execute(_lead_query().where(ContactRequest.id == contact_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Contact request not found")
    return lead


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
async def create_contact(contact: ContactCreate, db: AsyncSession = Depends(get_db)):
    new_contact = ContactRequest(**contact.model_dump(), status="new", is_read=False)
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
async def track_contact_action(event: ContactTrackCreate, db: AsyncSession = Depends(get_db)):
    """Record a high-intent contact click without claiming that a message was delivered."""
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
            event_data={
                "channel": payload.channel,
                "external_message_id": payload.external_message_id,
                "external_username": payload.external_username,
            },
        )
    )
    await db.commit()
    return await _get_lead(lead.id, db)


@router.patch("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: int,
    update: ContactUpdate,
    request: Request,
    current: AdminUser = Depends(require_permission("leads:write", csrf=True)),
    db: AsyncSession = Depends(get_db),
):
    lead = await _get_lead(contact_id, db)
    data = update.model_dump(exclude_unset=True)
    note = data.pop("note", None)
    old_status = lead.status
    next_status = data.get("status", old_status)
    next_outcome = data.get("outcome", lead.outcome)

    if next_status == "won":
        if not lead.property_id:
            raise HTTPException(status_code=422, detail="A won deal must be linked to a property")
        if next_outcome not in {"sold", "rented"}:
            raise HTTPException(status_code=422, detail="Select sold or rented for a won deal")

    for field, value in data.items():
        setattr(lead, field, value)
    lead.is_read = True

    now = datetime.now(timezone.utc)
    if next_status in {"won", "lost"}:
        lead.closed_at = lead.closed_at or now
    elif next_status != old_status:
        lead.closed_at = None
        if next_status != "won":
            lead.outcome = None

    if next_status == "won" and lead.property:
        lead.property.market_status = next_outcome
        lead.property.status_badge = "Продано" if next_outcome == "sold" else "Сдано"

    if next_status != old_status or data.get("outcome") or data.get("deal_value") is not None:
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
    lead = await _get_lead(contact_id, db)
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
