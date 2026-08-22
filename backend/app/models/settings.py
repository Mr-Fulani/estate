from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
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

    def __repr__(self) -> str:
        return f"<SiteSetting phone={self.phone}>"
