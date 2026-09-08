from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class PropertySlugAlias(Base):
    __tablename__ = 'property_slug_aliases'
    slug: Mapped[str] = mapped_column(String(255), primary_key=True)
    resource_id: Mapped[int] = mapped_column(Integer, ForeignKey('properties.id', ondelete='CASCADE'), nullable=False, index=True)


class NewsSlugAlias(Base):
    __tablename__ = 'news_slug_aliases'
    slug: Mapped[str] = mapped_column(String(255), primary_key=True)
    resource_id: Mapped[int] = mapped_column(Integer, ForeignKey('news_articles.id', ondelete='CASCADE'), nullable=False, index=True)
