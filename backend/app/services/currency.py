import asyncio
from datetime import date, datetime, timedelta, timezone
import xml.etree.ElementTree as ET

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exchange_rate import ExchangeRateSnapshot


CBR_DAILY_RATES_URL = "https://www.cbr.ru/scripts/XML_daily.asp"
SUPPORTED_CURRENCIES = ("USD", "EUR", "TRY")
CACHE_TTL = timedelta(hours=6)

_refresh_lock = asyncio.Lock()


def _decimal(value: str | None) -> float:
    if not value:
        raise ValueError("Missing exchange-rate value")
    return float(value.replace(" ", "").replace(",", "."))


def parse_cbr_daily_rates(payload: bytes) -> tuple[dict[str, float], date]:
    root = ET.fromstring(payload)
    rates: dict[str, float] = {"RUB": 1.0}

    for item in root.findall("Valute"):
        code = (item.findtext("CharCode") or "").strip().upper()
        if code not in SUPPORTED_CURRENCIES:
            continue
        unit_rate = item.findtext("VunitRate")
        if unit_rate:
            rates[code] = _decimal(unit_rate)
        else:
            nominal = _decimal(item.findtext("Nominal"))
            rates[code] = _decimal(item.findtext("Value")) / nominal

    missing = [code for code in SUPPORTED_CURRENCIES if code not in rates]
    if missing:
        raise ValueError(f"CBR response is missing currencies: {', '.join(missing)}")

    effective_date = datetime.strptime(root.attrib["Date"], "%d.%m.%Y").date()
    return rates, effective_date


async def _latest_snapshot(db: AsyncSession) -> ExchangeRateSnapshot | None:
    result = await db.execute(
        select(ExchangeRateSnapshot).where(ExchangeRateSnapshot.id == 1)
    )
    return result.scalar_one_or_none()


def _is_fresh(snapshot: ExchangeRateSnapshot, now: datetime) -> bool:
    fetched_at = snapshot.fetched_at
    if fetched_at.tzinfo is None:
        fetched_at = fetched_at.replace(tzinfo=timezone.utc)
    return now - fetched_at < CACHE_TTL


async def get_exchange_rates(db: AsyncSession) -> tuple[ExchangeRateSnapshot, bool]:
    now = datetime.now(timezone.utc)
    snapshot = await _latest_snapshot(db)
    if snapshot and _is_fresh(snapshot, now):
        return snapshot, False

    async with _refresh_lock:
        snapshot = await _latest_snapshot(db)
        now = datetime.now(timezone.utc)
        if snapshot and _is_fresh(snapshot, now):
            return snapshot, False

        try:
            async with httpx.AsyncClient(
                follow_redirects=True,
                timeout=httpx.Timeout(10.0),
                headers={"User-Agent": "Estate/1.0 (+exchange-rates)"},
            ) as client:
                response = await client.get(CBR_DAILY_RATES_URL)
                response.raise_for_status()
            rates, effective_date = parse_cbr_daily_rates(response.content)

            if snapshot is None:
                snapshot = ExchangeRateSnapshot(id=1)
                db.add(snapshot)
            snapshot.base_currency = "RUB"
            snapshot.rates = rates
            snapshot.effective_date = effective_date
            snapshot.fetched_at = now
            snapshot.source_url = CBR_DAILY_RATES_URL
            await db.commit()
            await db.refresh(snapshot)
            return snapshot, False
        except (httpx.HTTPError, ET.ParseError, KeyError, TypeError, ValueError):
            await db.rollback()
            if snapshot is not None:
                return snapshot, True
            raise
