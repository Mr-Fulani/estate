from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import get_settings
from app.api import auth, properties, categories, contacts, currency, admin, news, reviews, uploads, settings as settings_api

settings = get_settings()

app = FastAPI(title="Estate API")
Path(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
app.mount(settings.MEDIA_URL, StaticFiles(directory=settings.MEDIA_ROOT), name="uploads")

# CORS
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(properties.router)
app.include_router(categories.router)
app.include_router(contacts.router)
app.include_router(admin.router)
app.include_router(settings_api.router)
app.include_router(news.router)
app.include_router(reviews.router)
app.include_router(auth.router)
app.include_router(currency.router)
app.include_router(uploads.router)

@app.get("/")
async def root():
    return {"status": "ok", "project": "Estate API"}
