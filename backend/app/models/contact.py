from sqlalchemy import Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class ContactRequest(Base):
    __tablename__ = "contact_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    property_id: Mapped[int | None] = mapped_column(ForeignKey("properties.id"), nullable=True)
    property = relationship("Property")
    
    status: Mapped[str] = mapped_column(String(20), default="new")
    
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<ContactRequest {self.email}>"
