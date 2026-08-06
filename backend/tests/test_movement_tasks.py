"""Manager creates a movement task, staff completes it. Covers the two
fixes: creation is now audit-logged (previously only completion was), and
completing an already-completed task is rejected (previously a bare status
check with no row lock -- see complete_movement_task's docstring comment)."""

from datetime import date

import pytest

from app.activity.models import ActivityEvent
from app.auth.dependencies import get_current_user
from app.items.models import MovementTask, Product
from app.main import app
from app.users.models import User
from app.warehouses.models import Warehouse
from app.zones.models import Floor, ZoneSection, ZoneStockEntry


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

    manager = User(id="u-mgr", name="Manager", email="mgr@grandroyal.com",
                    hashed_password="x", role="manager", warehouse_id=wh.id,
                    status="active", joined_date=date(2024, 1, 1))
    staff = User(id="u-staff", name="Staff", email="staff@grandroyal.com",
                 hashed_password="x", role="staff", warehouse_id=wh.id,
                 status="active", joined_date=date(2024, 1, 1))
    db_session.add_all([manager, staff])

    product = Product(sku="SKU-1", name="Grand Royal Smooth", unit_price=10, unit_cost=5, reorder_level=5,
                       created_by="u-mgr", updated_by="u-mgr")
    db_session.add(product)
    db_session.flush()

    floor = Floor(warehouse_id=wh.id, level=1, name="Ground")
    db_session.add(floor)
    db_session.flush()

    section1 = ZoneSection(warehouse_id=wh.id, kind="shelf", floor_id=floor.id,
                            code="A1", name="A1", x=0, y=0, width=1, height=1, capacity=100)
    section2 = ZoneSection(warehouse_id=wh.id, kind="shelf", floor_id=floor.id,
                            code="A2", name="A2", x=1, y=0, width=1, height=1, capacity=100)
    db_session.add_all([section1, section2])
    db_session.flush()

    db_session.add(ZoneStockEntry(section_id=section1.id, product_id=product.id, quantity=50))
    db_session.commit()

    return {"wh": wh, "manager": manager, "staff": staff, "product": product,
            "section1": section1, "section2": section2}


def _create_task(client, world):
    return client.post(
        f"/warehouses/{world['wh'].id}/movement-tasks",
        json={
            "productId": world["product"].id,
            "quantity": 10,
            "fromShelfId": world["section1"].id,
            "toShelfId": world["section2"].id,
            "reason": "restock",
        },
    )


def test_creating_a_task_logs_activity_event(client, world, db_session):
    as_user(world["manager"])
    response = _create_task(client, world)
    assert response.status_code == 201

    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.title == "Movement task requested"
    assert event.actor_id == "u-mgr"
    assert "Manager" in event.description
    assert "Grand Royal Smooth" in event.description
    assert "A1" in event.description and "A2" in event.description


def test_completing_a_task_still_logs_activity_event(client, world, db_session):
    as_user(world["manager"])
    task_id = _create_task(client, world).json()["id"]

    as_user(world["staff"])
    response = client.post(f"/movement-tasks/{task_id}/complete")
    assert response.status_code == 200

    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.title == "Stock moved between shelves"
    assert event.actor_id == "u-staff"


def test_completing_an_already_completed_task_is_rejected(client, world):
    as_user(world["manager"])
    task_id = _create_task(client, world).json()["id"]

    as_user(world["staff"])
    first = client.post(f"/movement-tasks/{task_id}/complete")
    assert first.status_code == 200

    second = client.post(f"/movement-tasks/{task_id}/complete")
    assert second.status_code == 400
    assert "not pending" in second.json()["detail"].lower()


def test_completing_does_not_double_apply_stock_movement(client, world, db_session):
    """Guards the race-condition fix at the ledger level, not just the status
    check: even if complete were somehow called twice, the shelf quantity
    must reflect exactly one move, not two."""
    as_user(world["manager"])
    task_id = _create_task(client, world).json()["id"]

    as_user(world["staff"])
    client.post(f"/movement-tasks/{task_id}/complete")
    client.post(f"/movement-tasks/{task_id}/complete")  # rejected, must not double-move

    from_entry = (
        db_session.query(ZoneStockEntry)
        .filter(ZoneStockEntry.section_id == world["section1"].id, ZoneStockEntry.product_id == world["product"].id)
        .first()
    )
    to_entry = (
        db_session.query(ZoneStockEntry)
        .filter(ZoneStockEntry.section_id == world["section2"].id, ZoneStockEntry.product_id == world["product"].id)
        .first()
    )
    assert from_entry.quantity == 40  # 50 - 10, exactly once
    assert to_entry.quantity == 10  # exactly once

    task = db_session.get(MovementTask, task_id)
    assert task.status == "completed"
