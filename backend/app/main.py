from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.auth import router as auth
from app.users import router as users
from app.uploads import router as uploads
from app.config import settings

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

app.mount("/uploads", StaticFiles(directory=uploads.UPLOAD_ROOT), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}