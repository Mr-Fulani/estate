from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reviewer_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_locale: Mapped[str] = mapped_column(String(2), default="ru", index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False)

    property_id: Mapped[int | None] = mapped_column(
        ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True
    )
    contact_id: Mapped[int | None] = mapped_column(
        ForeignKey("contact_requests.id", ondelete="SET NULL"), nullable=True, unique=True, index=True
    )
    property = relationship("Property")
    contact = relationship("ContactRequest")

    invitation_token: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True, index=True)
    invitation_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    translations = relationship(
        "ReviewTranslation",
        back_populates="review",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ReviewTranslation.locale",
    )


class ReviewTranslation(Base):
    __tablename__ = "review_translations"
    __table_args__ = (UniqueConstraint("review_id", "locale", name="uq_review_translation_locale"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    review_id: Mapped[int] = mapped_column(
        ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True
    )
    locale: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    reviewer_role: Mapped[str | None] = mapped_column(String(160), nullable=True)
    company_response: Mapped[str | None] = mapped_column(Text, nullable=True)

    review = relationship("Review", back_populates="translations")
