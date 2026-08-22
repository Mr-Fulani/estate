from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False, index=True)
    cover_image: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    author: Mapped[str] = mapped_column(String(120), default="Estate")
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    translations = relationship(
        "NewsTranslation",
        back_populates="article",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="NewsTranslation.locale",
    )
    media = relationship(
        "NewsMedia",
        back_populates="article",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
        order_by="(NewsMedia.position, NewsMedia.id)",
    )


class NewsTranslation(Base):
    __tablename__ = "news_translations"
    __table_args__ = (
        UniqueConstraint("article_id", "locale", name="uq_news_translation_locale"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    article_id: Mapped[int] = mapped_column(
        ForeignKey("news_articles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    locale: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    excerpt: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    meta_title: Mapped[str | None] = mapped_column(String(240), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(320), nullable=True)

    article = relationship("NewsArticle", back_populates="translations")


class NewsMedia(Base):
    __tablename__ = "news_media"
    __table_args__ = (
        Index("ix_news_media_article_position", "article_id", "position"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    article_id: Mapped[int] = mapped_column(
        ForeignKey("news_articles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    media_type: Mapped[str] = mapped_column(String(16), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    article = relationship("NewsArticle", back_populates="media")
