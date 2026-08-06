"""Deep cross-role CRUD check: every mutating/listing endpoint, exercised by
admin/manager/staff (plus a manager/staff pinned to a DIFFERENT warehouse),
asserting the actual HTTP status matches what the router's require_role /
_scoped_warehouse_or_403 claims it should be. This is a live behavioral
check against the real dependency-injection chain, not a re-read of the
source -- disposable, deleted after the run confirms the matrix holds.
"""

from datetime import date

import pytest

from app.auth.dependencies import get_current_user
from app.items.models import Category, Product, Supplier
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
    wh1 = Warehouse(name="WH One", code="WH-001", location="A")
    wh2 = Warehouse(name="WH Two", code="WH-002", location="B")
    db_session.add_all([wh1, wh2])
    db_session.flush()

    admin = User(id="u-admin", name="Admin", email="admin@grandroyal.com",
                 hashed_password="x", role="admin", warehouse_id=None,
                 status="active", joined_date=date(2024, 1, 1))
    mgr1 = User(id="u-mgr1", name="Mgr One", email="mgr1@grandroyal.com",
                hashed_password="x", role="manager", warehouse_id=wh1.id,
                status="active", joined_date=date(2024, 1, 1))
    staff1 = User(id="u-staff1", name="Staff One", email="staff1@grandroyal.com",
                  hashed_password="x", role="staff", warehouse_id=wh1.id,
                  status="active", joined_date=date(2024, 1, 1))
    mgr2 = User(id="u-mgr2", name="Mgr Two", email="mgr2@grandroyal.com",
                hashed_password="x", role="manager", warehouse_id=wh2.id,
                status="active", joined_date=date(2024, 1, 1))
    db_session.add_all([admin, mgr1, staff1, mgr2])

    category = Category(name="Whisky")
    supplier = Supplier(name="Acme")
    db_session.add_all([category, supplier])
    db_session.flush()

    product = Product(sku="SKU-1", name="Grand Royal Smooth", category_id=category.id,
                       supplier_id=supplier.id, unit_price=10, unit_cost=5,
                       reorder_level=5, created_by=admin.id, updated_by=admin.id)
    db_session.add(product)
    db_session.flush()

    floor1 = Floor(warehouse_id=wh1.id, level=1, name="Ground")
    db_session.add(floor1)
    db_session.flush()
    section1 = ZoneSection(warehouse_id=wh1.id, kind="shelf", floor_id=floor1.id,
                            code="A1", name="A1", x=0, y=0, width=1, height=1, capacity=100)
    section2 = ZoneSection(warehouse_id=wh1.id, kind="shelf", floor_id=floor1.id,
                            code="A2", name="A2", x=1, y=0, width=1, height=1, capacity=100)
    db_session.add_all([section1, section2])
    db_session.flush()
    stock_entry = ZoneStockEntry(section_id=section1.id, product_id=product.id, quantity=50)
    db_session.add(stock_entry)
    db_session.commit()

    return {
        "wh1": wh1, "wh2": wh2, "admin": admin, "mgr1": mgr1, "staff1": staff1,
        "mgr2": mgr2, "category": category, "supplier": supplier, "product": product,
        "floor1": floor1, "section1": section1, "section2": section2,
    }


# ---------------------------------------------------------------------------
# Matrix: (method, path-builder, body-builder, allowed-roles, cross-warehouse-blocked)
# ---------------------------------------------------------------------------

def test_categories_crud_matrix(client, world):
    # list: any authenticated role
    for who in ("admin", "mgr1", "staff1"):
        as_user(world[who])
        assert client.get("/categories").status_code == 200

    # create: admin only
    as_user(world["mgr1"])
    assert client.post("/categories", json={"name": "New Cat A"}).status_code == 403
    as_user(world["staff1"])
    assert client.post("/categories", json={"name": "New Cat B"}).status_code == 403
    as_user(world["admin"])
    r = client.post("/categories", json={"name": "New Cat C"})
    assert r.status_code == 201
    cat_id = r.json()["id"]

    # delete: admin only
    as_user(world["mgr1"])
    assert client.delete(f"/categories/{cat_id}").status_code == 403
    as_user(world["admin"])
    assert client.delete(f"/categories/{cat_id}").status_code == 204


def test_suppliers_read_only_matrix(client, world):
    for who in ("admin", "mgr1", "staff1"):
        as_user(world[who])
        assert client.get("/suppliers").status_code == 200
    app.dependency_overrides.pop(get_current_user, None)
    assert client.get("/suppliers").status_code in (401, 403)


def test_product_creation_matrix(client, world):
    body = {"sku": "SKU-NEW-1", "name": "New Product", "categoryId": world["category"].id,
            "supplierId": world["supplier"].id, "unitPrice": 5.0}

    as_user(world["staff1"])
    assert client.post("/items", json=body).status_code == 403

    as_user(world["mgr1"])
    r = client.post("/items", json={**body, "sku": "SKU-NEW-MGR"})
    assert r.status_code == 201

    as_user(world["admin"])
    r = client.post("/items", json={**body, "sku": "SKU-NEW-ADMIN"})
    assert r.status_code == 201


def test_product_update_matrix(client, world):
    body = {"name": "Renamed"}
    as_user(world["staff1"])
    assert client.patch(f"/items/{world['product'].id}", json=body).status_code == 403
    as_user(world["mgr1"])
    assert client.patch(f"/items/{world['product'].id}", json=body).status_code == 200
    as_user(world["admin"])
    assert client.patch(f"/items/{world['product'].id}", json={"name": "Renamed2"}).status_code == 200


def test_inventory_endpoints_are_warehouse_scoped(client, world):
    wh1_id = world["wh1"].id
    # own warehouse: allowed for all three roles
    for who in ("admin", "mgr1", "staff1"):
        as_user(world[who])
        assert client.get(f"/warehouses/{wh1_id}/inventory").status_code == 200
        assert client.get(f"/warehouses/{wh1_id}/inventory/stats").status_code == 200
        assert client.get(f"/warehouses/{wh1_id}/movement-tasks").status_code == 200

    # mgr2 is pinned to wh2 -- must be blocked from wh1's data
    as_user(world["mgr2"])
    assert client.get(f"/warehouses/{wh1_id}/inventory").status_code == 403
    assert client.get(f"/warehouses/{wh1_id}/inventory/stats").status_code == 403
    assert client.get(f"/warehouses/{wh1_id}/movement-tasks").status_code == 403

    # admin is global -- can see wh2 (mgr1/staff1 cannot)
    as_user(world["admin"])
    assert client.get(f"/warehouses/{world['wh2'].id}/inventory").status_code == 200
    as_user(world["mgr1"])
    assert client.get(f"/warehouses/{world['wh2'].id}/inventory").status_code == 403


def test_movement_task_lifecycle_matrix(client, world):
    wh1_id = world["wh1"].id
    task_body = {"productId": world["product"].id, "quantity": 5,
                 "fromShelfId": world["section1"].id, "toShelfId": world["section2"].id,
                 "reason": "restock"}

    # staff cannot create a movement task
    as_user(world["staff1"])
    assert client.post(f"/warehouses/{wh1_id}/movement-tasks", json=task_body).status_code == 403

    # manager of a DIFFERENT warehouse cannot create one for wh1
    as_user(world["mgr2"])
    assert client.post(f"/warehouses/{wh1_id}/movement-tasks", json=task_body).status_code == 403

    # mgr1 (correct warehouse) can create
    as_user(world["mgr1"])
    r = client.post(f"/warehouses/{wh1_id}/movement-tasks", json=task_body)
    assert r.status_code == 201
    task_id = r.json()["id"]

    # staff CAN complete a task (all three roles allowed per router)
    as_user(world["staff1"])
    r = client.post(f"/movement-tasks/{task_id}/complete")
    assert r.status_code == 200


def test_zones_and_floors_matrix(client, world):
    wh1_id = world["wh1"].id

    # list: all three roles, own warehouse only
    for who in ("admin", "mgr1", "staff1"):
        as_user(world[who])
        assert client.get(f"/warehouses/{wh1_id}/floors").status_code == 200
        assert client.get(f"/warehouses/{wh1_id}/zones").status_code == 200

    as_user(world["mgr2"])
    assert client.get(f"/warehouses/{wh1_id}/floors").status_code == 403
    assert client.get(f"/warehouses/{wh1_id}/zones").status_code == 403

    # create floor: admin/manager only, own warehouse
    as_user(world["staff1"])
    assert client.post(f"/warehouses/{wh1_id}/floors", json={"level": 2, "name": "Upper"}).status_code == 403
    as_user(world["mgr2"])
    assert client.post(f"/warehouses/{wh1_id}/floors", json={"level": 2, "name": "Upper"}).status_code == 403
    as_user(world["mgr1"])
    r = client.post(f"/warehouses/{wh1_id}/floors", json={"level": 2, "name": "Upper"})
    assert r.status_code == 201

    # propose_change: manager-only (not even admin, per router)
    propose_body = {"items": [{"actionType": "update", "sectionId": world["section1"].id,
                                "proposedData": {"name": "A1-renamed"}}], "requestNote": "tidy up"}
    as_user(world["admin"])
    assert client.post(f"/warehouses/{wh1_id}/layout-requests", json=propose_body).status_code == 403
    as_user(world["staff1"])
    assert client.post(f"/warehouses/{wh1_id}/layout-requests", json=propose_body).status_code == 403
    as_user(world["mgr1"])
    r = client.post(f"/warehouses/{wh1_id}/layout-requests", json=propose_body)
    assert r.status_code == 201
    request_id = r.json()["id"]

    # apply_direct / approve / reject: admin only
    as_user(world["mgr1"])
    assert client.post(f"/layout-requests/{request_id}/approve").status_code == 403
    as_user(world["admin"])
    assert client.post(f"/layout-requests/{request_id}/approve").status_code == 204


def test_warehouse_admin_crud_matrix(client, world):
    # create: admin only
    as_user(world["mgr1"])
    assert client.post("/warehouses", json={"name": "New WH", "location": "X"}).status_code == 403
    as_user(world["admin"])
    r = client.post("/warehouses", json={"name": "New WH", "location": "X"})
    assert r.status_code == 201
    new_wh_id = r.json()["id"]

    # update profile: admin/manager, own warehouse only
    profile_body = {"manager": "Someone", "address": "X", "phone": "1", "email": "a@b.com",
                     "nextInspection": "01-01-2026", "status": "Active"}
    as_user(world["mgr2"])
    assert client.put(f"/warehouses/{world['wh1'].id}/profile", json=profile_body).status_code == 403
    as_user(world["mgr1"])
    assert client.put(f"/warehouses/{world['wh1'].id}/profile", json=profile_body).status_code == 200

    # delete: admin only, and blocked by FK if warehouse has dependents (wh1 has users/floors)
    as_user(world["mgr1"])
    assert client.delete(f"/warehouses/{new_wh_id}").status_code == 403
    as_user(world["admin"])
    assert client.delete(f"/warehouses/{new_wh_id}").status_code == 204
    # NOTE: the "delete blocked by FK dependents (users/floors)" behavior
    # (see dashboard/router.py's IntegrityError -> 409 handling) can't be
    # exercised here -- the SQLite in-memory test DB does not enforce FK
    # constraints by default, unlike the real Postgres DB. Verified via code
    # read instead: delete_warehouse catches IntegrityError and returns 409.


def test_users_admin_only_matrix(client, world):
    for who in ("mgr1", "staff1"):
        as_user(world[who])
        assert client.get("/users").status_code == 403
        assert client.get(f"/users/{world['staff1'].id}").status_code == 403
        assert client.put(f"/users/{world['staff1'].id}", json={"name": "X"}).status_code == 403
        assert client.delete(f"/users/{world['staff1'].id}").status_code == 403

    as_user(world["admin"])
    assert client.get("/users").status_code == 200
    assert client.get(f"/users/{world['staff1'].id}").status_code == 200
    assert client.put(f"/users/{world['staff1'].id}", json={"name": "Staff Renamed"}).status_code == 200
    # admin cannot delete self
    assert client.delete(f"/users/{world['admin'].id}").status_code == 400
    assert client.delete(f"/users/{world['staff1'].id}").status_code == 204


def test_dashboard_role_gating_matrix(client, world):
    as_user(world["staff1"])
    assert client.get("/status-cards").status_code == 200
    assert client.get("/sales/overview").status_code == 403  # admin/manager only
    assert client.get("/activities").status_code == 403  # admin/manager only
    assert client.put("/sales/goal", json={"target": 1000}).status_code == 403  # admin only

    as_user(world["mgr1"])
    assert client.get("/sales/overview").status_code == 200
    assert client.get("/activities").status_code == 200
    assert client.put("/sales/goal", json={"target": 1000}).status_code == 403

    as_user(world["admin"])
    assert client.put("/sales/goal", json={"target": 1000}).status_code == 200


def test_uploads_gating_matrix(client, world):
    import io
    jpeg_bytes = bytes.fromhex("ffd8ffe000104a46494600010100000100010000ffd9")
    file = ("test.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")

    as_user(world["staff1"])
    assert client.post("/uploads/warehouse-image", files={"file": file}).status_code == 403

    app.dependency_overrides.pop(get_current_user, None)
    file2 = ("test.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")
    assert client.post("/uploads/warehouse-image", files={"file": file2}).status_code in (401, 403)

    as_user(world["mgr1"])
    file3 = ("test.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")
    assert client.post("/uploads/warehouse-image", files={"file": file3}).status_code == 201


def test_orders_and_purchases_warehouse_filtering(client, world, db_session):
    from app.orders.models import Order
    from app.purchases.models import PurchaseOrder

    order_wh1 = Order(warehouse_id=world["wh1"].id, order_no="ORD-1", customer_name="C1",
                       status="pending", total=10)
    order_wh2 = Order(warehouse_id=world["wh2"].id, order_no="ORD-2", customer_name="C2",
                       status="pending", total=20)
    db_session.add_all([order_wh1, order_wh2])
    db_session.commit()

    as_user(world["mgr1"])
    r = client.get("/orders")
    assert r.status_code == 200
    order_nos = {o["id"] for o in r.json()}
    assert "ORD-1" in order_nos
    assert "ORD-2" not in order_nos  # cross-warehouse leak check

    as_user(world["admin"])
    r = client.get("/orders")
    order_nos = {o["id"] for o in r.json()}
    assert "ORD-1" in order_nos and "ORD-2" in order_nos  # admin sees all
