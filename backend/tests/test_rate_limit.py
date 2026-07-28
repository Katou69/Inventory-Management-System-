"""Per-IP rate limiting on auth endpoints (slowapi), complementing the
per-account login_attempts/lockout_until: this stops one IP hammering many
different accounts, which the per-account lockout alone cannot.
"""

from datetime import date

from app.rate_limit import limiter
from app.users.models import User
from app.auth.jwt import hash_password


def _create_user(db_session, email="user@grandroyal.com", password="secret123"):
    user = User(
        name="Test User", email=email, hashed_password=hash_password(password),
        role="staff", warehouse_id=None, status="active", joined_date=date(2024, 1, 1),
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_login_is_throttled_after_the_per_ip_limit(client, db_session):
    # A different, nonexistent email each call -- keeps this isolated from the
    # PER-ACCOUNT lockout (MAX_LOGIN_ATTEMPTS=3 in auth/router.py), which would
    # otherwise trip first and mask whether the PER-IP limit works at all.
    for i in range(10):
        response = client.post("/auth/login", json={"email": f"nobody{i}@grandroyal.com", "password": "wrong"})
        assert response.status_code == 401, f"call {i}: {response.status_code} {response.text}"

    # The 11th, from the same (fake) client IP, is throttled instead of
    # reaching the real auth logic at all -- this is the case the per-account
    # lockout alone cannot catch: one IP spraying many different accounts.
    response = client.post("/auth/login", json={"email": "nobody-final@grandroyal.com", "password": "wrong"})
    assert response.status_code == 429


def test_register_is_throttled_after_the_per_ip_limit(client, db_session):
    for i in range(5):
        response = client.post(
            "/auth/register",
            json={"name": "New User", "email": f"new{i}@grandroyal.com", "password": "Secret123!", "warehouse_id": 1},
        )
        assert response.status_code in (201, 400)  # 400 if warehouse 1 doesn't exist in this test's DB

    response = client.post(
        "/auth/register",
        json={"name": "One More", "email": "onemore@grandroyal.com", "password": "Secret123!", "warehouse_id": 1},
    )
    assert response.status_code == 429


def test_rate_limit_is_per_test_not_shared_across_tests(client, db_session):
    """Guards against the isolation bug this suite hit during development:
    TestClient always reports the same fake IP, so without limiter.reset()
    between tests, whichever test runs after another has already exhausted
    the bucket would fail with an unrelated 429."""
    _create_user(db_session)
    response = client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "secret123"})
    assert response.status_code == 200
