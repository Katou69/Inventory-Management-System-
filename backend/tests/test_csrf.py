"""CSRF (double-submit cookie) regression tests.

CSRFMiddleware only enforces the check when the request carries a session
cookie (access_token/refresh_token) AND isn't an exempt URL — login/register
have no session yet, and /auth/refresh is called server-to-server from Next's
proxy.ts (forwards only the raw cookie header, no browser JS context to read
a CSRF cookie from) so it stays exempt too. /auth/logout is NOT exempt: it's
only ever called from the browser, which already attaches x-csrftoken.
"""

from datetime import date

from app.users.models import User
from app.auth.jwt import hash_password


def _create_user(db_session, email="user@grandroyal.com", password="secret123"):
    user = User(
        name="Test User",
        email=email,
        hashed_password=hash_password(password),
        role="admin",
        warehouse_id=None,
        status="active",
        joined_date=date(2024, 1, 1),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_login_and_register_work_with_no_csrf_header(client, db_session):
    _create_user(db_session, email="user@grandroyal.com", password="secret123")
    response = client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "secret123"})
    assert response.status_code == 200


def test_mutating_request_without_csrf_header_is_rejected(client, db_session):
    _create_user(db_session, email="user@grandroyal.com", password="secret123")
    client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "secret123"})

    # TestClient's cookie jar now has access_token + refresh_token + csrftoken,
    # but httpx/TestClient does NOT auto-echo cookies into headers, so this
    # mutating request has no x-csrftoken header attached.
    response = client.put("/users/me/settings", json={"language": "Thai"})
    assert response.status_code == 403
    assert "CSRF" in response.text


def test_mutating_request_with_correct_csrf_header_succeeds(client, db_session):
    _create_user(db_session, email="user@grandroyal.com", password="secret123")
    client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "secret123"})

    csrf_token = client.cookies.get("csrftoken")
    assert csrf_token is not None

    response = client.put(
        "/users/me/settings",
        json={"language": "Thai"},
        headers={"x-csrftoken": csrf_token},
    )
    assert response.status_code == 200
    assert response.json()["language"] == "Thai"


def test_mutating_request_with_wrong_csrf_header_is_rejected(client, db_session):
    _create_user(db_session, email="user@grandroyal.com", password="secret123")
    client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "secret123"})

    response = client.put(
        "/users/me/settings",
        json={"language": "Thai"},
        headers={"x-csrftoken": "not-the-real-token"},
    )
    assert response.status_code == 403


def test_get_requests_never_require_csrf(client, db_session):
    _create_user(db_session, email="user@grandroyal.com", password="secret123")
    client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "secret123"})

    response = client.get("/auth/me")
    assert response.status_code == 200


def test_logout_without_csrf_header_is_rejected(client, db_session):
    # Unlike /auth/refresh, logout is only ever called from the browser
    # (which always attaches x-csrftoken) -- so it must NOT be exempt, or a
    # malicious page could force a victim's session to log out cross-site.
    _create_user(db_session, email="user@grandroyal.com", password="secret123")
    client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "secret123"})

    response = client.post("/auth/logout")
    assert response.status_code == 403


def test_logout_with_correct_csrf_header_succeeds(client, db_session):
    _create_user(db_session, email="user@grandroyal.com", password="secret123")
    client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "secret123"})

    csrf_token = client.cookies.get("csrftoken")
    response = client.post("/auth/logout", headers={"x-csrftoken": csrf_token})
    assert response.status_code == 200
