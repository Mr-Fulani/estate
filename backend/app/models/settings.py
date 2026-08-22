from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class SiteSetting(Base):
    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    phone: Mapped[str] = mapped_column(String(50), default="+90 (552) 123-00-00")
    email: Mapped[str] = mapped_column(String(100), default="support@estate-agency.ru")
    address: Mapped[str] = mapped_column(String(300), default="г. Стамбул, Бейликдюзю")
    working_hours: Mapped[str] = mapped_column(String(100), default="Ежедневно с 9:00 до 21:00")
    telegram: Mapped[str | None] = mapped_column(String(200), default="https://t.me/estate_agency", nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(200), default="https://wa.me/905521230000", nullable=True)
    vk: Mapped[str | None] = mapped_column(String(200), default="", nullable=True)
    youtube: Mapped[str | None] = mapped_column(String(200), default="https://youtube.com/@estate_agency", nullable=True)
    instagram: Mapped[str | None] = mapped_column(String(200), default="", nullable=True)
    facebook: Mapped[str | None] = mapped_column(String(200), default="", nullable=True)
    max_messenger: Mapped[str | None] = mapped_column(String(200), default="", nullable=True)
    translations = relationship(
        "SiteSettingTranslation",
        back_populates="setting",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="SiteSettingTranslation.locale",
    )

    def __repr__(self) -> str:
        return f"<SiteSetting phone={self.phone}>"


class SiteSettingTranslation(Base):
    __tablename__ = "site_setting_translations"
    __table_args__ = (
        UniqueConstraint("setting_id", "locale", name="uq_site_setting_translation_locale"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    setting_id: Mapped[int] = mapped_column(
        ForeignKey("site_settings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    locale: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    working_hours: Mapped[str] = mapped_column(String(100), nullable=False)

    setting = relationship("SiteSetting", back_populates="translations")
