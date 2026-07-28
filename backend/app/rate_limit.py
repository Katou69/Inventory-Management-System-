"""Per-IP request throttling (slowapi), separate from the per-account
login_attempts/lockout_until in auth/router.py.

Own module so routers can import `limiter` for the `@limiter.limit(...)`
decorator without importing from main.py (which registers it on the app).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
