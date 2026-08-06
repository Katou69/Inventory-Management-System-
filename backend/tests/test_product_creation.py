"""POST /items -- the only product-creation endpoint. Before this, there was
no way to create a product at all (only PATCH for existing ones)."""

from datetime import date

import pytest

from app.activity.models import ActivityEvent
from app.auth.dependencies import get_current_user
from app.items.models import Category, Product, Supplier
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
    category = Category(name="Whisky")
    supplier = Supplier(name="Acme Distributors")
    db_session.add_all([category, supplier])
    db_session.commit()
    return {"admin": admin, "manager": manager, "staff": staff, "category": category, "supplier": supplier}


def as_user(user: User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


@pytest.fixture(autouse=True)
def _clear_override():
    yield
    app.dependency_overrides.pop(get_current_user, None)


def _body(setup, sku="SKU-NEW"):
    return {
        "sku": sku,
        "name": "New Whisky",
        "categoryId": setup["category"].id,
        "supplierId": setup["supplier"].id,
        "unitPrice": 19.99,
        "unitCost": 9.5,
        "reorderLevel": 10,
    }


def test_create_product_succeeds_as_admin(client, setup, db_session):
    as_user(setup["admin"])
    response = client.post("/items", json=_body(setup))
    assert response.status_code == 201
    body = response.json()
    assert body["sku"] == "SKU-NEW"
    assert body["name"] == "New Whisky"
    assert body["price"] == 19.99
    assert body["category"] == "Whisky"
    assert body["supplier"] == "Acme Distributors"
    assert body["stock"] == 0
    assert body["status"] == "out_of_stock"
    assert db_session.query(Product).filter(Product.sku == "SKU-NEW").first() is not None


def test_create_product_succeeds_as_manager(client, setup):
    as_user(setup["manager"])
    response = client.post("/items", json=_body(setup))
    assert response.status_code == 201


def test_create_product_rejected_for_staff(client, setup):
    as_user(setup["staff"])
    response = client.post("/items", json=_body(setup))
    assert response.status_code == 403


def test_duplicate_sku_is_rejected(client, setup):
    as_user(setup["admin"])
    client.post("/items", json=_body(setup, sku="SKU-DUP"))
    response = client.post("/items", json=_body(setup, sku="SKU-DUP"))
    assert response.status_code == 409


def test_create_product_logs_activity_event(client, setup, db_session):
    as_user(setup["admin"])
    client.post("/items", json=_body(setup, sku="SKU-LOG"))

    event = db_session.query(ActivityEvent).order_by(ActivityEvent.id.desc()).first()
    assert event.title == "Product created"
    assert event.actor_id == "u-admin"
    assert "SKU-LOG" in event.description
    assert "New Whisky" in event.description


def test_create_product_with_unknown_category_returns_400(client, setup):
    as_user(setup["admin"])
    body = _body(setup)
    body["categoryId"] = 9999
    response = client.post("/items", json=body)
    assert response.status_code == 400


def test_create_product_with_unknown_supplier_returns_400(client, setup):
    as_user(setup["admin"])
    body = _body(setup)
    body["supplierId"] = 9999
    response = client.post("/items", json=body)
    assert response.status_code == 400


def test_create_product_with_missing_required_fields_returns_422(client, setup):
    as_user(setup["admin"])
    response = client.post("/items", json={"name": "No SKU or price"})
    assert response.status_code == 422


def test_create_product_stores_provided_image(client, setup, db_session):
    as_user(setup["admin"])
    body = _body(setup, sku="SKU-IMG")
    body["image"] = "/uploads/warehouses/abc123.jpg"
    response = client.post("/items", json=body)
    assert response.status_code == 201

    product = db_session.query(Product).filter(Product.sku == "SKU-IMG").first()
    assert product.image == "/uploads/warehouses/abc123.jpg"


def test_create_product_without_image_uses_default(client, setup, db_session):
    as_user(setup["admin"])
    response = client.post("/items", json=_body(setup, sku="SKU-NOIMG"))
    assert response.status_code == 201

    product = db_session.query(Product).filter(Product.sku == "SKU-NOIMG").first()
    assert product.image == "/images/ellipse-2.png"


def test_create_product_defaults_category_and_supplier_to_none(client, setup):
    as_user(setup["admin"])
    response = client.post("/items", json={
        "sku": "SKU-MINIMAL", "name": "Minimal Product", "unitPrice": 5.0,
    })
    assert response.status_code == 201
    body = response.json()
    assert body["category"] == ""
    assert body["supplier"] == ""
