from datetime import date

from app.models.user import User
from app.security import hash_password


def _create_user(db_session, email="user@example.com", password="secret123"):
    user = User(
        name="Test User",
        email=email,
        hashed_password=hash_password(password),
        role="staff",
        warehouse_id="1",
        status="active",
        joined_date=date(2024, 1, 1),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_login_success_sets_cookies(client, db_session):
    _create_user(db_session, email="user@example.com", password="secret123")

    response = client.post("/auth/login", json={"email": "user@example.com", "password": "secret123"})

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "user@example.com"
    # Tokens are delivered as cookies, not in the body.
    assert "access_token" not in body
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


def test_login_wrong_password(client, db_session):
    _create_user(db_session, email="user@example.com", password="secret123")

    response = client.post("/auth/login", json={"email": "user@example.com", "password": "wrong"})

    assert response.status_code == 401


def test_login_unknown_email(client, db_session):
    response = client.post("/auth/login", json={"email": "nobody@example.com", "password": "secret123"})

    assert response.status_code == 401


def test_me_after_login_via_cookie(client, db_session):
    _create_user(db_session, email="user@example.com", password="secret123")
    client.post("/auth/login", json={"email": "user@example.com", "password": "secret123"})

    # TestClient persists the cookie jar across requests.
    response = client.get("/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


def test_me_without_cookie(client, db_session):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_refresh_rotates_and_returns_user(client, db_session):
    _create_user(db_session, email="user@example.com", password="secret123")
    client.post("/auth/login", json={"email": "user@example.com", "password": "secret123"})

    response = client.post("/auth/refresh")

    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"
    assert "access_token" in response.cookies


def test_logout_revokes_refresh_token(client, db_session):
    _create_user(db_session, email="user@example.com", password="secret123")
    login = client.post("/auth/login", json={"email": "user@example.com", "password": "secret123"})
    old_refresh = login.cookies["refresh_token"]

    logout = client.post("/auth/logout")
    assert logout.status_code == 200

    # Reusing the revoked refresh token must fail, even if replayed directly.
    client.cookies.set("refresh_token", old_refresh)
    replay = client.post("/auth/refresh")
    assert replay.status_code == 401
