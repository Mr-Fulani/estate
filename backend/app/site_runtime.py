from app.config import get_settings

SUPPORTED_LOCALES = ('ru', 'en', 'tr', 'ar')
SUPPORTED_CURRENCIES = ('RUB', 'USD', 'EUR', 'TRY')


def site_runtime() -> dict:
    config = get_settings()
    return {
        'locales': [value.strip() for value in config.SITE_LOCALES.split(',')],
        'default_locale': config.SITE_DEFAULT_LOCALE,
        'currencies': [value.strip() for value in config.SITE_CURRENCIES.split(',')],
        'default_currency': config.SITE_DEFAULT_CURRENCY,
        'catalog_currency': config.CATALOG_CURRENCY,
    }
