"""GET /suppliers -- read-only list, any authenticated role (matches
GET /categories)."""

from datetime import date

import pytest

from app.auth.dependencies import get_current_user
from app.items.models import Supplier
from app.main import app
from app.users.models import User


@pytest.fixture()
def setup(db_session):
    admin = User(id="u-admin", name="Admin User", email="admin@grandroyal.com",
                 hashed_password="x", role="admin", warehouse_id=None,
                 status="active", joined_date=date(2024, 1, 1))
    manager = User(id="u-manager", name="Manager User", email="manager@grandroyal.com",
                    hashed_password="x", role="manager", warehouse_id=None,
                    status="active", joined_date=date(2024, 1, 1))
    staff = User(id="u-staff", name="Staff User", email="staff@grandroyal.com",
                 hashed_password="x", role="staff", warehouse_id=None,
                 status="active", joined_date=date(2024, 1, 1))
    db_session.add_all([admin, manager, staff])
    db_session.add_all([Supplier(name="Beta Supply"), Supplier(name="Acme Distributors")])
    db_session.commit()
    return {"admin": admin, "manager": manager, "staff": staff}


def as_user(user: User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


@pytest.fixture(autouse=True)
def _clear_override():
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.parametrize("role_key", ["admin", "manager", "staff"])
def test_list_suppliers_returns_all_for_any_role(client, setup, role_key):
    as_user(setup[role_key])
    response = client.get("/suppliers")
    assert response.status_code == 200
    names = [s["name"] for s in response.json()]
    assert names == ["Acme Distributors", "Beta Supply"]


def test_list_suppliers_requires_authentication(client, setup):
    response = client.get("/suppliers")
    assert response.status_code in (401, 403)
