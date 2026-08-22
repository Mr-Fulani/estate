from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PropertyTranslation(Base):
    __tablename__ = "property_translations"
    __table_args__ = (
        UniqueConstraint("property_id", "locale", name="uq_property_translation_locale"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    property_id: Mapped[int] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    locale: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    meta_title: Mapped[str | None] = mapped_column(String(240), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    status_badge: Mapped[str | None] = mapped_column(String(100), nullable=True)

    property = relationship("Property", back_populates="translations")
