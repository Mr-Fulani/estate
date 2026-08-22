from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from app.database import get_db
from app.models.property import Property
from app.models.contact import ContactRequest
from app.models.category import Category
from app.models.review import Review
from app.models.admin_user import AdminUser
from app.security import require_permission

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

class AdminStatsResponse(BaseModel):
    total_properties: int
    active_properties: int
    featured_properties: int
    total_contacts: int
    new_contacts: int
    categories_count: int
    form_leads: int
    messenger_clicks: int
    messenger_messages: int
    active_leads: int
    won_deals: int
    lost_leads: int
    sold_properties: int
    rented_properties: int
    total_deal_value: float
    deal_base_currency: str
    deal_totals_by_currency: dict[str, float]
    unconverted_won_deals: int
    pending_reviews: int

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    _: AdminUser = Depends(require_permission("dashboard:view")),
    db: AsyncSession = Depends(get_db),
):
    # Total properties
    res_prop = await db.execute(select(func.count(Property.id)))
    total_properties = res_prop.scalar_one()

    # Active properties
    res_active = await db.execute(select(func.count(Property.id)).where(Property.is_active == True))
    active_properties = res_active.scalar_one()

    # Featured properties
    res_feat = await db.execute(select(func.count(Property.id)).where(Property.is_featured == True))
    featured_properties = res_feat.scalar_one()

    # Total contacts
    res_cont = await db.execute(select(func.count(ContactRequest.id)))
    total_contacts = res_cont.scalar_one()

    # New contacts
    res_new = await db.execute(select(func.count(ContactRequest.id)).where(ContactRequest.status == "new"))
    new_contacts = res_new.scalar_one()

    res_forms = await db.execute(select(func.count(ContactRequest.id)).where(ContactRequest.kind == "form"))
    form_leads = res_forms.scalar_one()

    res_messenger = await db.execute(
        select(func.count(ContactRequest.id)).where(
            ContactRequest.kind == "click",
            ContactRequest.channel.in_(["whatsapp", "telegram", "max", "instagram", "facebook", "vk"]),
        )
    )
    messenger_clicks = res_messenger.scalar_one()
    res_messages = await db.execute(select(func.count(ContactRequest.id)).where(ContactRequest.kind == "webhook"))
    messenger_messages = res_messages.scalar_one()

    res_active_leads = await db.execute(
        select(func.count(ContactRequest.id)).where(
            ContactRequest.status.in_(["contacted", "qualified", "viewing", "negotiation"])
        )
    )
    active_leads = res_active_leads.scalar_one()

    res_won = await db.execute(select(func.count(ContactRequest.id)).where(ContactRequest.status == "won"))
    won_deals = res_won.scalar_one()
    res_lost = await db.execute(select(func.count(ContactRequest.id)).where(ContactRequest.status == "lost"))
    lost_leads = res_lost.scalar_one()

    res_sold = await db.execute(select(func.count(Property.id)).where(Property.market_status == "sold"))
    sold_properties = res_sold.scalar_one()
    res_rented = await db.execute(select(func.count(Property.id)).where(Property.market_status == "rented"))
    rented_properties = res_rented.scalar_one()
    res_value = await db.execute(
        select(func.coalesce(func.sum(ContactRequest.deal_value_rub), 0)).where(
            ContactRequest.status == "won"
        )
    )
    total_deal_value = float(res_value.scalar_one())
    res_currency_totals = await db.execute(
        select(ContactRequest.deal_currency, func.sum(ContactRequest.deal_value))
        .where(ContactRequest.status == "won", ContactRequest.deal_value.is_not(None))
        .group_by(ContactRequest.deal_currency)
        .order_by(ContactRequest.deal_currency)
    )
    deal_totals_by_currency = {
        currency: float(total)
        for currency, total in res_currency_totals.all()
    }
    res_unconverted = await db.execute(
        select(func.count(ContactRequest.id)).where(
            ContactRequest.status == "won",
            ContactRequest.deal_value.is_not(None),
            ContactRequest.deal_value_rub.is_(None),
        )
    )
    unconverted_won_deals = res_unconverted.scalar_one()
    res_reviews = await db.execute(select(func.count(Review.id)).where(Review.status == "pending"))
    pending_reviews = res_reviews.scalar_one()

    # Categories count
    res_cat = await db.execute(select(func.count(Category.id)))
    categories_count = res_cat.scalar_one()

    return AdminStatsResponse(
        total_properties=total_properties,
        active_properties=active_properties,
        featured_properties=featured_properties,
        total_contacts=total_contacts,
        new_contacts=new_contacts,
        categories_count=categories_count,
        form_leads=form_leads,
        messenger_clicks=messenger_clicks,
        messenger_messages=messenger_messages,
        active_leads=active_leads,
        won_deals=won_deals,
        lost_leads=lost_leads,
        sold_properties=sold_properties,
        rented_properties=rented_properties,
        total_deal_value=total_deal_value,
        deal_base_currency="RUB",
        deal_totals_by_currency=deal_totals_by_currency,
        unconverted_won_deals=unconverted_won_deals,
        pending_reviews=pending_reviews,
    )
