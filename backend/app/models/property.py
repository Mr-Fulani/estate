from app.config import get_settings
from sqlalchemy import Integer, String, Text, Numeric, Float, Boolean, ForeignKey, DateTime, JSON, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from typing import Any

class Property(Base):
    __tablename__ = "properties"
    content_locale: Mapped[str] = mapped_column(String(2), default=lambda: get_settings().SITE_DEFAULT_LOCALE, nullable=False)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="RUB")
    address: Mapped[str | None] = mapped_column(String(300))
    city: Mapped[str | None] = mapped_column(String(100), index=True)
    district: Mapped[str | None] = mapped_column(String(100))
    area: Mapped[float | None] = mapped_column(Float)
    rooms: Mapped[int | None] = mapped_column(Integer)
    floor: Mapped[int | None] = mapped_column(Integer)
    total_floors: Mapped[int | None] = mapped_column(Integer)
    year_built: Mapped[int | None] = mapped_column(Integer)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    transaction_type: Mapped[str] = mapped_column(String(20), default="sale", index=True)
    market_status: Mapped[str] = mapped_column(String(20), default="available", index=True)
    status_badge: Mapped[str | None] = mapped_column(String(100), default="Актуально", nullable=True)
    
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    category = relationship("Category", back_populates="properties")

    translations = relationship(
        "PropertyTranslation",
        back_populates="property",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="PropertyTranslation.locale",
    )
    
    images: Mapped[list[Any] | None] = mapped_column(JSON().with_variant(JSONB, 'postgresql'), default=list)

    listing_kind: Mapped[str] = mapped_column(String(20), default="property", server_default="property")
    development: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, 'postgresql'), nullable=True)
    unit_types: Mapped[list["PropertyUnitType"]] = relationship(
        back_populates="property", cascade="all, delete-orphan", lazy="selectin",
        order_by="PropertyUnitType.position",
    )

    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<Property {self.title}>"


class PropertyUnitType(Base):
    __tablename__ = "property_unit_types"
    __table_args__ = (
        UniqueConstraint("property_id", "code", name="uq_property_unit_code"),
        CheckConstraint("(area_min IS NULL AND area_max IS NULL) OR (area_min IS NOT NULL AND area_max IS NOT NULL AND area_min > 0 AND area_max >= area_min)", name="ck_unit_area_range"),
        CheckConstraint("(price_min IS NULL AND price_max IS NULL) OR (price_min IS NOT NULL AND price_max IS NOT NULL AND price_min > 0 AND price_max >= price_min)", name="ck_unit_price_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id", ondelete="CASCADE"), index=True)
    code: Mapped[str] = mapped_column(String(40))
    rooms: Mapped[int] = mapped_column(Integer)
    area_min: Mapped[float | None] = mapped_column(Float)
    area_max: Mapped[float | None] = mapped_column(Float)
    price_min: Mapped[float | None] = mapped_column(Numeric(12, 2))
    price_max: Mapped[float | None] = mapped_column(Numeric(12, 2))
    plans: Mapped[list[str]] = mapped_column(JSON().with_variant(JSONB, 'postgresql'), default=list)
    plan_details: Mapped[list[dict]] = mapped_column(JSON().with_variant(JSONB, 'postgresql'), default=list, server_default='[]')
    position: Mapped[int] = mapped_column(Integer, default=0)
    property: Mapped[Property] = relationship(back_populates="unit_types")
