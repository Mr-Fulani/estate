from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    properties = relationship("Property", back_populates="category")
    translations = relationship(
        "CategoryTranslation",
        back_populates="category",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="CategoryTranslation.locale",
    )

    def __repr__(self) -> str:
        return f"<Category {self.name}>"


class CategoryTranslation(Base):
    __tablename__ = "category_translations"
    __table_args__ = (
        UniqueConstraint("category_id", "locale", name="uq_category_translation_locale"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    locale: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    category = relationship("Category", back_populates="translations")
