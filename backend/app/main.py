from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, uploads

app = FastAPI(title="Inventory Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(uploads.router)

app.mount("/uploads", StaticFiles(directory=uploads.UPLOAD_ROOT), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
