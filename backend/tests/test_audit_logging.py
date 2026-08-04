"""Audit trail for privilege-sensitive mutations.

Before this: PUT/DELETE /users/{id} and DELETE /warehouses/{id} left no
trace of who did what -- an admin could promote staff to admin, delete an
account, or delete a warehouse with nothing recorded anywhere. These three
are the ones where "who did this and when" has real consequences (as
opposed to e.g. a notification-read toggle).
"""

from datetime import date

import pytest

from app.activity.models import ActivityEvent
from app.auth.dependencies import get_current_user
from app.main import app
from app.users.models import User
from app.warehouses.models import Warehouse


@pytest.fixture()
def setup(db_session):
    db_session.add(Warehouse(id=1, name="Main", code="WH-001"))
    db_session.flush()

    admin = User(id="u-admin", name="Admin User", email="admin@grandroyal.com",
                 hashed_password="x", role="admin", warehouse_id=None,
                 status="active", joined_date=date(2024, 1, 1))
    staff = User(id="u-staff", name="Staff One", email="staff1@grandroyal.com",
                 hashed_password="x", role="staff", warehouse_id=1,
                 status="active", joined_date=date(2024, 1, 1))
    db_session.add_all([admin, staff])
    db_session.commit()
    return {"admin": admin, "staff": staff}


def as_user(user: User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


@pytest.fixture(autouse=True)
def _clear_override():
    yield
    app.dependency_overrides.pop(get_current_user, None)


def test_role_change_is_logged(client, setup, db_session):
    as_user(setup["admin"])
    client.put(f"/users/{setup['staff'].id}", json={"role": "manager"})

    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event is not None
    assert event.title == "User account updated"
    assert event.actor_id == "u-admin"
    assert "role: 'staff' -> 'manager'" in event.description


def test_status_change_is_logged(client, setup, db_session):
    as_user(setup["admin"])
    client.put(f"/users/{setup['staff'].id}", json={"status": "inactive"})

    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.title == "User account updated"
    assert "status: 'active' -> 'inactive'" in event.description


def test_setting_a_field_to_its_current_value_logs_nothing(client, setup, db_session):
    as_user(setup["admin"])
    before = db_session.query(ActivityEvent).count()

    response = client.put(f"/users/{setup['staff'].id}", json={"status": "active"})
    assert response.status_code == 200

    after = db_session.query(ActivityEvent).count()
    assert after == before


def test_user_deletion_is_logged_with_the_deleted_users_details(client, setup, db_session):
    as_user(setup["admin"])
    staff_id, staff_name, staff_email = setup["staff"].id, setup["staff"].name, setup["staff"].email

    response = client.delete(f"/users/{staff_id}")
    assert response.status_code == 204

    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.title == "User account deleted"
    assert event.actor_id == "u-admin"
    assert staff_name in event.description
    assert staff_email in event.description


def test_warehouse_deletion_is_logged(client, setup, db_session):
    # Detach the staff member first: the test SQLite engine doesn't enforce
    # FK constraints (no PRAGMA foreign_keys=ON), so a dependent-row 409 can't
    # be exercised here the way it was verified live against real Postgres
    # (see the IDOR-fix session notes) -- this test only covers the
    # successful-delete logging path.
    setup["staff"].warehouse_id = None
    db_session.commit()

    as_user(setup["admin"])
    response = client.delete("/warehouses/1")
    assert response.status_code == 204

    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.title == "Warehouse deleted"
    assert event.actor_id == "u-admin"
    assert "Main" in event.description
    assert "WH-001" in event.description
