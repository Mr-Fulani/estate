from datetime import date
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, JSON, Numeric, String, Text, text
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class ContactRequest(Base):
    __tablename__ = "contact_requests"
    __table_args__ = (
        Index(
            "uq_contact_requests_won_property",
            "property_id",
            unique=True,
            postgresql_where=text("status = 'won' AND property_id IS NOT NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20))
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    property_id: Mapped[int | None] = mapped_column(ForeignKey("properties.id"), nullable=True)
    property = relationship("Property")
    
    kind: Mapped[str] = mapped_column(String(20), default="form", index=True)
    channel: Mapped[str] = mapped_column(String(30), default="form", index=True)
    source: Mapped[str] = mapped_column(String(80), default="contact_form", index=True)
    locale: Mapped[str | None] = mapped_column(String(2), nullable=True)
    page_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    referrer: Mapped[str | None] = mapped_column(Text, nullable=True)
    utm_source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(120), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(160), nullable=True)
    utm_content: Mapped[str | None] = mapped_column(String(160), nullable=True)
    utm_term: Mapped[str | None] = mapped_column(String(160), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    external_conversation_id: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    external_username: Mapped[str | None] = mapped_column(String(160), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="new", index=True)
    outcome: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    deal_value: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    deal_currency: Mapped[str] = mapped_column(String(3), default="RUB")
    deal_value_rub: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    deal_exchange_rate: Mapped[float | None] = mapped_column(Numeric(18, 8), nullable=True)
    deal_rate_effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    previous_property_market_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    previous_property_status_badge: Mapped[str | None] = mapped_column(String(100), nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(120), nullable=True)
    next_follow_up_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    activities = relationship(
        "LeadActivity",
        back_populates="contact",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by=lambda: LeadActivity.created_at.desc(),
    )

    def __repr__(self) -> str:
        return f"<ContactRequest {self.email or self.phone}>"


class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    contact_id: Mapped[int] = mapped_column(
        ForeignKey("contact_requests.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    from_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    to_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSON(), nullable=True
    )
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    contact = relationship("ContactRequest", back_populates="activities")
