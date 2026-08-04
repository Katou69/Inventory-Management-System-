"""Login must not leak account state (exists / locked-out / pending
approval) to anyone who hasn't already supplied the correct password --
otherwise the endpoint becomes an oracle for probing valid emails and
credential pairs.
"""

from datetime import date, datetime, timedelta, timezone

from app.auth.jwt import hash_password
from app.users.models import User


def _create_user(db_session, **overrides):
    defaults = dict(
        name="Test User", email="user@grandroyal.com",
        hashed_password=hash_password("secret123"),
        role="staff", warehouse_id=None, status="active",
        joined_date=date(2024, 1, 1),
    )
    defaults.update(overrides)
    user = User(**defaults)
    db_session.add(user)
    db_session.commit()
    return user


def test_nonexistent_email_and_wrong_password_give_identical_response(client, db_session):
    _create_user(db_session)

    r_no_user = client.post("/auth/login", json={"email": "ghost@grandroyal.com", "password": "whatever"})
    r_wrong_pw = client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "wrongpass"})

    assert r_no_user.status_code == r_wrong_pw.status_code == 401
    assert r_no_user.json()["detail"] == r_wrong_pw.json()["detail"]


def test_wrong_password_for_pending_account_does_not_reveal_pending_status(client, db_session):
    _create_user(db_session, email="pending@grandroyal.com", status="pending")

    response = client.post("/auth/login", json={"email": "pending@grandroyal.com", "password": "wrongpass"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_correct_password_for_pending_account_reveals_pending_status(client, db_session):
    _create_user(db_session, email="pending2@grandroyal.com", status="pending")

    response = client.post("/auth/login", json={"email": "pending2@grandroyal.com", "password": "secret123"})

    assert response.status_code == 401
    assert "not activated" in response.json()["detail"]


def test_wrong_password_for_locked_account_does_not_reveal_lockout(client, db_session):
    _create_user(
        db_session, email="locked@grandroyal.com",
        lockout_until=datetime.now(timezone.utc) + timedelta(minutes=10),
    )

    response = client.post("/auth/login", json={"email": "locked@grandroyal.com", "password": "wrongpass"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_correct_password_for_locked_account_reveals_lockout(client, db_session):
    _create_user(
        db_session, email="locked2@grandroyal.com",
        lockout_until=datetime.now(timezone.utc) + timedelta(minutes=10),
    )

    response = client.post("/auth/login", json={"email": "locked2@grandroyal.com", "password": "secret123"})

    assert response.status_code == 429
