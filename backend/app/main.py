from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.database import engine, Base
from app.api import properties, categories, contacts, admin, settings as settings_api

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            # Note: For production use Alembic, this is just for dev convenience
            await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Estate API", lifespan=lifespan)

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

@app.get("/")
async def root():
    return {"status": "ok", "project": "Estate API"}
