"""Admin-provisioned accounts: POST /users (temp password, active immediately,
must_change_password=True) and PUT /users/me/change-password (the forced
first-login reset). Separate flow from self-registration (POST /auth/register),
which is staff-only and starts "pending"."""

from datetime import date

import pytest

from app.activity.models import ActivityEvent
from app.auth.dependencies import get_current_user
from app.auth.jwt import hash_password
from app.main import app
from app.users.models import User
from app.warehouses.models import Warehouse


def as_user(user: User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


@pytest.fixture(autouse=True)
def _clear_override():
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture()
def world(db_session):
    wh = Warehouse(name="WH", code="WH-001", location="X")
    db_session.add(wh)
    db_session.flush()

    admin = User(id="u-admin", name="Admin", email="admin@grandroyal.com",
                 hashed_password="x", role="admin", warehouse_id=None,
                 status="active", joined_date=date(2024, 1, 1))
    staff = User(id="u-staff", name="Staff", email="staff@grandroyal.com",
                 hashed_password=hash_password("OldPassw0rd!"), role="staff",
                 warehouse_id=wh.id, status="active", joined_date=date(2024, 1, 1))
    db_session.add_all([admin, staff])
    db_session.commit()

    return {"wh": wh, "admin": admin, "staff": staff}


def _create_body(**overrides):
    body = {
        "name": "Taylor Kim",
        "email": "taylor@grandroyal.com",
        "password": "TempPassw0rd!",
        "role": "staff",
        "warehouse_id": None,
    }
    body.update(overrides)
    return body


def test_admin_creates_user_active_with_temp_password_flag(client, world):
    as_user(world["admin"])
    response = client.post("/users", json=_create_body(warehouse_id=world["wh"].id))
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "active"
    assert body["mustChangePassword"] is True
    assert body["warehouseId"] == world["wh"].id


def test_non_admin_cannot_create_user(client, world):
    as_user(world["staff"])
    response = client.post("/users", json=_create_body())
    assert response.status_code == 403


def test_duplicate_email_rejected(client, world):
    as_user(world["admin"])
    response = client.post("/users", json=_create_body(email="staff@grandroyal.com"))
    assert response.status_code == 409


def test_non_grandroyal_email_rejected(client, world):
    as_user(world["admin"])
    response = client.post("/users", json=_create_body(email="taylor@example.com"))
    assert response.status_code == 400


def test_unknown_warehouse_rejected(client, world):
    as_user(world["admin"])
    response = client.post("/users", json=_create_body(warehouse_id=9999))
    assert response.status_code == 400


def test_warehouse_optional_for_admin_role(client, world):
    as_user(world["admin"])
    response = client.post("/users", json=_create_body(role="admin", warehouse_id=None))
    assert response.status_code == 201
    assert response.json()["warehouseId"] == "all"


def test_creation_logs_activity_event(client, world, db_session):
    as_user(world["admin"])
    client.post("/users", json=_create_body(warehouse_id=world["wh"].id))
    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.title == "User account created"
    assert "Taylor Kim" in event.description


def test_change_password_succeeds_and_clears_flag(client, world, db_session):
    as_user(world["admin"])
    created = client.post("/users", json=_create_body(warehouse_id=world["wh"].id)).json()

    new_user = db_session.get(User, created["id"])
    as_user(new_user)
    response = client.put(
        "/users/me/change-password",
        json={"current_password": "TempPassw0rd!", "new_password": "BrandNewPassw0rd!"},
    )
    assert response.status_code == 200
    assert response.json()["mustChangePassword"] is False


def test_change_password_wrong_current_password_rejected(client, world):
    as_user(world["staff"])
    response = client.put(
        "/users/me/change-password",
        json={"current_password": "WrongPassword!", "new_password": "BrandNewPassw0rd!"},
    )
    assert response.status_code == 401
