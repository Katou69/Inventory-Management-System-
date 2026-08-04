"""Audit trail for stock-ledger-affecting mutations.

Of the second-tier gaps found in the wider log_event() audit (categories,
floors, sales goal, movement-task requests, movement-task completion,
product edits), only these two actually change money or on-hand stock --
the rest are structural/cosmetic and were deliberately left unlogged.
"""

from datetime import date

import pytest

from app.activity.models import ActivityEvent
from app.auth.dependencies import get_current_user
from app.items.models import Product
from app.items.models import MovementTask
from app.main import app
from app.users.models import User
from app.warehouses.models import Warehouse
from app.zones.models import ZoneSection, ZoneStockEntry


@pytest.fixture()
def setup(db_session):
    db_session.add(Warehouse(id=1, name="Main", code="WH-001"))
    admin = User(id="u-admin", name="Admin User", email="admin@grandroyal.com",
                 hashed_password="x", role="admin", warehouse_id=None,
                 status="active", joined_date=date(2024, 1, 1))
    db_session.add(admin)
    product = Product(sku="SKU-1", name="Widget", unit_price=10, unit_cost=4, reorder_level=5)
    db_session.add(product)
    db_session.add_all([
        ZoneSection(id=1, warehouse_id=1, kind="shelf", code="A", name="Shelf A",
                    x=0, y=0, width=1, height=1, capacity=100),
        ZoneSection(id=2, warehouse_id=1, kind="shelf", code="B", name="Shelf B",
                    x=0, y=0, width=1, height=1, capacity=100),
    ])
    db_session.flush()
    db_session.add(ZoneStockEntry(section_id=1, product_id=product.id, quantity=20))
    db_session.commit()
    return {"admin": admin, "product": product}


def as_user(user: User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


@pytest.fixture(autouse=True)
def _clear_override():
    yield
    app.dependency_overrides.pop(get_current_user, None)


def test_price_change_is_logged(client, setup, db_session):
    as_user(setup["admin"])
    response = client.patch(f"/items/{setup['product'].id}", json={"price": 15.5})
    assert response.status_code == 200

    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.title == "Product updated"
    assert event.actor_id == "u-admin"
    assert "price: 10.00 -> 15.5" in event.description


def test_setting_price_to_its_current_value_logs_nothing(client, setup, db_session):
    as_user(setup["admin"])
    before = db_session.query(ActivityEvent).count()

    response = client.patch(f"/items/{setup['product'].id}", json={"price": 10})
    assert response.status_code == 200

    after = db_session.query(ActivityEvent).count()
    assert after == before


def test_completing_a_movement_task_is_logged(client, setup, db_session):
    as_user(setup["admin"])
    task = MovementTask(
        product_id=setup["product"].id, warehouse_id=1,
        from_section_id=1, to_section_id=2, quantity=5,
        requested_by="u-admin", reason="rebalance", status="pending",
    )
    db_session.add(task)
    db_session.commit()

    response = client.post(f"/movement-tasks/{task.id}/complete")
    assert response.status_code == 200

    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.title == "Stock moved between shelves"
    assert event.actor_id == "u-admin"
    assert "5 x Widget" in event.description
    assert "Shelf A" in event.description
    assert "Shelf B" in event.description


def test_a_movement_task_that_fails_to_complete_does_not_leave_a_log_entry(client, setup, db_session):
    as_user(setup["admin"])
    # Requests moving more than is on the shelf -- complete_movement_task
    # raises ValueError before ever reaching the log_event/commit.
    task = MovementTask(
        product_id=setup["product"].id, warehouse_id=1,
        from_section_id=1, to_section_id=2, quantity=999,
        requested_by="u-admin", reason="oops", status="pending",
    )
    db_session.add(task)
    db_session.commit()
    before = db_session.query(ActivityEvent).count()

    response = client.post(f"/movement-tasks/{task.id}/complete")
    assert response.status_code == 400

    after = db_session.query(ActivityEvent).count()
    assert after == before
