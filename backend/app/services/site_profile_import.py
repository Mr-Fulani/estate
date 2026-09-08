"""Explicit project profile import; never runs during startup or migrations."""
from copy import deepcopy

from app.schemas.site_profile import SiteProfile


def fill_missing_profile(current: dict, incoming: dict) -> dict:
    """Restore missing project data while preserving later CMS edits."""
    patch = SiteProfile.model_validate(incoming).model_dump(by_alias=True, exclude_unset=True)
    existing_brand = current.get('brand_name', '').strip()
    incoming_brand = patch.get('brand_name', '').strip()
    if existing_brand and incoming_brand and existing_brand.casefold() != incoming_brand.casefold():
        raise ValueError('This database already belongs to another company')

    def merge(existing, defaults):
        result = deepcopy(existing)
        for key, value in defaults.items():
            if isinstance(value, dict) and isinstance(result.get(key), dict):
                result[key] = merge(result[key], value)
            elif key not in result or result[key] is None or result[key] == '' or result[key] == []:
                result[key] = deepcopy(value)
        return result

    return SiteProfile.model_validate(merge(current, patch)).model_dump(by_alias=True)
