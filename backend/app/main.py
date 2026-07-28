import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette_csrf import CSRFMiddleware

from app.auth import router as auth
from app.users import router as users
from app.uploads import router as uploads
from app.zones import router as zones
from app.dashboard import router as dashboard
from app.config import settings
from app.items import router as items
from app.orders import router as orders
from app.purchases import router as purchases

app = FastAPI(title="Inventory Management API")

# CSRF only matters once a session cookie exists to be forged, so login/
# register (no session yet) and refresh/logout (no browser JS context — called
# server-side from Next's proxy.ts with only the raw cookie header forwarded)
# are exempt. Everything else that carries access_token/refresh_token must
# echo the csrftoken cookie back as a header, or a malicious site's forged
# request rides on the auth cookie alone with no way to prove it's really us.
app.add_middleware(
    CSRFMiddleware,
    secret=settings.csrf_secret_value,
    sensitive_cookies={"access_token", "refresh_token"},
    exempt_urls=[re.compile(r"^/auth/(login|register|refresh|logout)$")],
    cookie_samesite=settings.cookie_samesite,
    cookie_secure=settings.cookie_secure,
    cookie_domain=settings.cookie_domain,
)

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
app.include_router(items.router)
app.include_router(orders.router)
app.include_router(purchases.router)

app.mount("/uploads", StaticFiles(directory=uploads.UPLOAD_ROOT), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}