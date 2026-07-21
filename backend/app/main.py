from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.auth import router as auth
from app.users import router as users
from app.uploads import router as uploads
from app.zones import router as zones
from app.dashboard import router as dashboard
from app.config import settings
from app.items import router as items
from app.warehouses import router as warehouses

app = FastAPI(title="Inventory Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(uploads.router)
app.include_router(zones.router)
app.include_router(dashboard.router)
app.include_router(warehouses.router)
app.include_router(items.router)

app.mount("/uploads", StaticFiles(directory=uploads.UPLOAD_ROOT), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}