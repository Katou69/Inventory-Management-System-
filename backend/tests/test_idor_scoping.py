"""Cross-warehouse IDOR regression tests.

Before this fix: warehouse detail/edit/delete only checked role, never
whether the warehouse belonged to the caller, and /orders + /purchase-orders
had no warehouse filter at all — a manager or staff of warehouse 1 could
read/write warehouse 2's data by ID/URL alone.
"""

from datetime import date

import pytest

from app.auth.dependencies import get_current_user
from app.items.models import Product
from app.main import app
from app.orders.models import Order
from app.purchases.models import PurchaseOrder
from app.users.models import User
from app.warehouses.models import Warehouse


@pytest.fixture()
def setup(db_session):
    db_session.add_all([
        Warehouse(id=1, name="Main", code="WH-001"),
        Warehouse(id=2, name="North", code="WH-002"),
    ])
    db_session.flush()

    admin = User(id="u-admin", name="Admin User", email="admin@grandroyal.com",
                 hashed_password="x", role="admin", warehouse_id=None,
                 status="active", joined_date=date(2024, 1, 1))
    manager1 = User(id="u-mgr1", name="Manager One", email="mgr1@grandroyal.com",
                     hashed_password="x", role="manager", warehouse_id=1,
                     status="active", joined_date=date(2024, 1, 1))
    staff1 = User(id="u-staff1", name="Staff One", email="staff1@grandroyal.com",
                  hashed_password="x", role="staff", warehouse_id=1,
                  status="active", joined_date=date(2024, 1, 1))
    db_session.add_all([admin, manager1, staff1])

    order1 = Order(order_no="ORD-001", customer_name="Acme", total=10, warehouse_id=1,
                    placed_at=date(2024, 1, 1))
    order2 = Order(order_no="ORD-002", customer_name="Globex", total=20, warehouse_id=2,
                    placed_at=date(2024, 1, 1))
    db_session.add_all([order1, order2])

    po1 = PurchaseOrder(po_no="PO-001", warehouse_id=1, total=10, placed_at=date(2024, 1, 1))
    po2 = PurchaseOrder(po_no="PO-002", warehouse_id=2, total=20, placed_at=date(2024, 1, 1))
    db_session.add_all([po1, po2])

    db_session.commit()
    return {"admin": admin, "manager1": manager1, "staff1": staff1}


def as_user(user: User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


@pytest.fixture(autouse=True)
def _clear_override():
    yield
    app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# Warehouse detail / edit / delete
# ---------------------------------------------------------------------------


def test_manager_cannot_view_another_warehouses_detail(client, setup):
    as_user(setup["manager1"])
    assert client.get("/warehouses/2").status_code == 403
    assert client.get("/warehouses/1").status_code == 200


def test_staff_cannot_view_another_warehouses_detail(client, setup):
    as_user(setup["staff1"])
    assert client.get("/warehouses/2").status_code == 403
    assert client.get("/warehouses/1").status_code == 200


def test_manager_cannot_edit_another_warehouses_profile(client, setup):
    as_user(setup["manager1"])
    body = {
        "manager": "Someone", "address": "1 Main St", "phone": "555",
        "email": "wh@example.com", "nextInspection": "01-01-2027", "status": "Active",
    }
    assert client.put("/warehouses/2/profile", json=body).status_code == 403


def test_admin_can_view_and_edit_any_warehouse(client, setup):
    as_user(setup["admin"])
    assert client.get("/warehouses/2").status_code == 200
    body = {
        "manager": "Someone", "address": "1 Main St", "phone": "555",
        "email": "wh@example.com", "nextInspection": "01-01-2027", "status": "Active",
    }
    assert client.put("/warehouses/2/profile", json=body).status_code == 200


def test_admin_deleting_another_warehouse_still_hits_404_for_missing_id(client, setup):
    as_user(setup["admin"])
    assert client.delete("/warehouses/999").status_code == 404


# ---------------------------------------------------------------------------
# Orders / purchase orders
# ---------------------------------------------------------------------------


def test_staff_only_sees_their_own_warehouses_orders(client, setup):
    as_user(setup["staff1"])
    ids = {row["id"] for row in client.get("/orders").json()}
    assert ids == {"ORD-001"}


def test_manager_only_sees_their_own_warehouses_purchase_orders(client, setup):
    as_user(setup["manager1"])
    ids = {row["id"] for row in client.get("/purchase-orders").json()}
    assert ids == {"PO-001"}


def test_admin_sees_orders_and_purchase_orders_across_all_warehouses(client, setup):
    as_user(setup["admin"])
    order_ids = {row["id"] for row in client.get("/orders").json()}
    po_ids = {row["id"] for row in client.get("/purchase-orders").json()}
    assert order_ids == {"ORD-001", "ORD-002"}
    assert po_ids == {"PO-001", "PO-002"}
