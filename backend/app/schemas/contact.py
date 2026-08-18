from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime

class ContactBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    property_id: Optional[int] = None

class ContactCreate(ContactBase):
    pass

class ContactResponse(ContactBase):
    id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
