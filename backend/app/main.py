import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
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
from app.rate_limit import limiter

app = FastAPI(title="Inventory Management API")

# Per-IP throttling on auth endpoints (see app/rate_limit.py + the
# @limiter.limit(...) decorators in auth/router.py), complementing rather than
# replacing the per-account login_attempts/lockout_until there: that stops one
# attacker hammering ONE account, this stops one IP hammering MANY accounts
# (credential stuffing) or spamming /register. In-memory storage is fine for
# a single-process deploy; swap to Redis (RATELIMIT_STORAGE_URL) if this ever
# runs multi-worker, since counts would otherwise be per-process, not global.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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

# allow_origins is the real gate (browsers only skip CORS checks for these
# origins); methods/headers are narrowed too, on general least-privilege
# grounds, to just what the frontend actually sends -- Content-Type and the
# CSRF double-submit header (see api-client.ts's csrfHeader()).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "x-csrftoken"],
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