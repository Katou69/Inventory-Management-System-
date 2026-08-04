"""Access-token revocation via token_version.

Signed, unexpired JWTs are otherwise valid until they naturally expire --
there is no way to individually revoke one. token_version closes that gap:
every access token carries the user's token_version at mint time (the "tv"
claim), get_current_user rejects any token whose "tv" doesn't match the
CURRENT value in the DB, and logout / an admin role-or-status change both
bump it, instantly invalidating every access token issued before that point.
"""

from datetime import date

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token, hash_password
from app.main import app
from app.users.models import User


def _create_user(db_session, email="user@grandroyal.com", password="secret123", role="staff"):
    user = User(
        name="Test User", email=email, hashed_password=hash_password(password),
        role=role, warehouse_id=None, status="active", joined_date=date(2024, 1, 1),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_access_token_works_normally_before_any_revocation(client, db_session):
    _create_user(db_session)
    client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "secret123"})

    response = client.get("/auth/me")
    assert response.status_code == 200


def test_replaying_an_access_token_captured_before_logout_is_rejected(client, db_session):
    _create_user(db_session)
    login_resp = client.post("/auth/login", json={"email": "user@grandroyal.com", "password": "secret123"})
    stolen_token = login_resp.cookies.get("access_token")
    assert stolen_token is not None

    client.post("/auth/logout", headers={"x-csrftoken": client.cookies.get("csrftoken")})

    # Attacker replays the captured (still cryptographically valid, unexpired)
    # token in a fresh client with no other cookies.
    with TestClient(app) as attacker:
        attacker.cookies.set("access_token", stolen_token)
        response = attacker.get("/auth/me")
    assert response.status_code == 401


def test_admin_deactivating_a_user_immediately_invalidates_their_access_token(client, db_session):
    _create_user(db_session, email="admin@grandroyal.com", role="admin")
    victim = _create_user(db_session, email="victim@grandroyal.com")

    login_resp = client.post("/auth/login", json={"email": "victim@grandroyal.com", "password": "secret123"})
    victim_token = login_resp.cookies.get("access_token")
    assert victim_token is not None

    client.post("/auth/login", json={"email": "admin@grandroyal.com", "password": "secret123"})
    csrf_token = client.cookies.get("csrftoken")
    response = client.put(
        f"/users/{victim.id}", json={"status": "inactive"}, headers={"x-csrftoken": csrf_token}
    )
    assert response.status_code == 200

    with TestClient(app) as victim_client:
        victim_client.cookies.set("access_token", victim_token)
        response = victim_client.get("/auth/me")
    assert response.status_code == 401


def test_admin_editing_only_name_does_not_bump_token_version(client, db_session):
    """Only role/status changes affect authorization -- bumping on every
    field edit would pointlessly log out a user because their display name
    changed."""
    _create_user(db_session, email="admin2@grandroyal.com", role="admin")
    target = _create_user(db_session, email="target@grandroyal.com")

    login_resp = client.post("/auth/login", json={"email": "target@grandroyal.com", "password": "secret123"})
    target_token = login_resp.cookies.get("access_token")

    client.post("/auth/login", json={"email": "admin2@grandroyal.com", "password": "secret123"})
    csrf_token = client.cookies.get("csrftoken")
    response = client.put(
        f"/users/{target.id}", json={"name": "Renamed"}, headers={"x-csrftoken": csrf_token}
    )
    assert response.status_code == 200

    with TestClient(app) as target_client:
        target_client.cookies.set("access_token", target_token)
        response = target_client.get("/auth/me")
    assert response.status_code == 200


def test_token_signed_with_a_stale_token_version_claim_is_rejected(db_session):
    """Direct unit check on get_current_user's own comparison, independent of
    which endpoint triggers the bump."""
    user = _create_user(db_session)
    stale_token = create_access_token(user.id, user.token_version)

    user.token_version += 1
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(access_token=stale_token, db=db_session)
    assert exc_info.value.status_code == 401
