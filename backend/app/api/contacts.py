from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.contact import ContactRequest
from app.schemas.contact import ContactCreate, ContactResponse

router = APIRouter(prefix="/api/v1/contacts", tags=["Contacts"])

@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(contact: ContactCreate, db: AsyncSession = Depends(get_db)):
    new_contact = ContactRequest(**contact.model_dump())
    db.add(new_contact)
    await db.commit()
    await db.refresh(new_contact)
    return new_contact
