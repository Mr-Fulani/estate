from app.config import get_settings


def require_demo_import():
    settings = get_settings()
    if settings.ENVIRONMENT == 'production' or not settings.ALLOW_DEMO_IMPORT:
        raise RuntimeError('Demo/client example imports require ALLOW_DEMO_IMPORT=true in a non-production environment')
