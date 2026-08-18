from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import Optional
from app.database import get_db
from app.models.contact import ContactRequest
from app.schemas.contact import ContactCreate, ContactResponse

router = APIRouter(prefix="/api/v1/contacts", tags=["Contacts"])

@router.get("", include_in_schema=False)
@router.get("/", response_model=list[ContactResponse])
async def list_contacts(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db)
):
    query = select(ContactRequest).order_by(desc(ContactRequest.created_at))
    if status_filter:
        query = query.where(ContactRequest.status == status_filter)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", include_in_schema=False)
@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(contact: ContactCreate, db: AsyncSession = Depends(get_db)):
    new_contact = ContactRequest(**contact.model_dump())
    db.add(new_contact)
    await db.commit()
    await db.refresh(new_contact)
    return new_contact

@router.patch("/{contact_id}/status", response_model=ContactResponse)
async def update_contact_status(contact_id: int, new_status: str = Query(...), db: AsyncSession = Depends(get_db)):
    query = select(ContactRequest).where(ContactRequest.id == contact_id)
    result = await db.execute(query)
    contact = result.scalars().first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact request not found")
        
    contact.status = new_status
    await db.commit()
    await db.refresh(contact)
    return contact

@router.delete("/{contact_id}")
async def delete_contact(contact_id: int, db: AsyncSession = Depends(get_db)):
    query = select(ContactRequest).where(ContactRequest.id == contact_id)
    result = await db.execute(query)
    contact = result.scalars().first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact request not found")
        
    await db.delete(contact)
    await db.commit()
    return {"success": True, "message": "Contact request deleted"}
