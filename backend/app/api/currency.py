from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.currency import ExchangeRatesResponse
from app.services.currency import get_exchange_rates


router = APIRouter(prefix="/api/v1/currency", tags=["Currency"])


@router.get("/rates", response_model=ExchangeRatesResponse)
async def exchange_rates(db: AsyncSession = Depends(get_db)):
    try:
        snapshot, stale = await get_exchange_rates(db)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Official exchange rates are temporarily unavailable",
        ) from exc

    return ExchangeRatesResponse(
        rates=snapshot.rates,
        effective_date=snapshot.effective_date,
        fetched_at=snapshot.fetched_at,
        source=snapshot.source_url,
        stale=stale,
    )
