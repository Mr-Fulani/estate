"""Synchronize development data without replacing existing unit identities."""
from fastapi import HTTPException
from app.models.property import Property, PropertyUnitType
from app.schemas.property import DevelopmentProfile


def sync_development(item: Property, units: list[dict] | None = None) -> None:
    if item.listing_kind != "development":
        if units or item.development or item.unit_types:
            raise HTTPException(422, "Apartment types and development details require a residential development")
        return
    profile = DevelopmentProfile.model_validate(item.development or {})
    item.development = profile.model_dump(mode="json")
    if profile.is_demo:
        item.is_featured = False
    if item.currency not in {"USD", "EUR", "TRY", "RUB"}:
        raise HTTPException(422, "Unsupported development currency")
    if units is not None:
        codes = [unit["code"] for unit in units]
        if len(codes) != len(set(codes)):
            raise HTTPException(422, "Apartment type codes must be unique")
        existing = {unit.code: unit for unit in item.unit_types}
        synchronized = []
        for position, values in enumerate(units):
            unit = existing.get(values["code"]) or PropertyUnitType()
            for key, value in values.items():
                setattr(unit, key, value)
            unit.position = position
            synchronized.append(unit)
        item.unit_types[:] = synchronized
    if not item.unit_types:
        raise HTTPException(422, "A development needs at least one apartment type")
    prices = [unit.price_min for unit in item.unit_types if unit.price_min is not None]
    areas = [unit.area_min for unit in item.unit_types if unit.area_min is not None]
    if not prices:
        raise HTTPException(422, "Добавьте хотя бы один вариант с ценой для расчёта стоимости комплекса «от»")
    item.price = min(prices)
    item.area = min(areas) if areas else None
    item.rooms = None
