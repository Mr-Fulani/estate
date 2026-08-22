from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


CurrencyCode = Literal["RUB", "USD", "EUR", "TRY"]


class ExchangeRatesResponse(BaseModel):
    base: Literal["RUB"] = "RUB"
    rates: dict[CurrencyCode, float]
    effective_date: date
    fetched_at: datetime
    source: str
    stale: bool = False
