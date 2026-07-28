"""Orders endpoint tests."""

from datetime import date

from app.items.models import Product
from app.orders import service
from app.orders.models import Order, OrderItem, OrderPick
from app.warehouses.models import Warehouse
from app.zones.models import ZoneSection


def _setup(db):
    wh = Warehouse(id=1, name="Test WH", code="WH-001")
    db.add(wh)
    widget = Product(sku="SKU-1", name="Widget", unit_price=10, unit_cost=4, reorder_level=5)
    db.add(widget)
    section = ZoneSection(warehouse_id=1, kind="shelf", code="S1", name="Shelf 1",
                           x=0, y=0, width=1, height=1, capacity=100)
    db.add(section)
    db.flush()
    return widget, section


def test_get_orders_with_no_items_returns_empty_list(db_session):
    db_session.add(Order(order_no="ORD-001", customer_name="Acme", total=0, placed_at=date(2026, 1, 1)))
    db_session.commit()

    rows = service.get_orders(db_session)
    assert rows[0]["id"] == "ORD-001"
    assert rows[0]["customer"] == "Acme"
    assert rows[0]["items"] == []


def test_get_orders_item_without_picks_has_empty_pickedfrom(db_session):
    widget, _section = _setup(db_session)
    order = Order(order_no="ORD-002", customer_name="Bob", total=100, placed_at=date(2026, 1, 2))
    db_session.add(order)
    db_session.flush()
    db_session.add(OrderItem(order_id=order.id, product_id=widget.id, quantity=5))
    db_session.commit()

    rows = service.get_orders(db_session)
    row = next(r for r in rows if r["id"] == "ORD-002")
    assert row["items"] == [{"product": "Widget", "quantity": 5, "pickedFrom": []}]


def test_get_orders_resolves_picked_shelf_names(db_session):
    widget, section = _setup(db_session)
    order = Order(order_no="ORD-003", customer_name="Carol", total=50, placed_at=date(2026, 1, 3))
    db_session.add(order)
    db_session.flush()
    item = OrderItem(order_id=order.id, product_id=widget.id, quantity=5)
    db_session.add(item)
    db_session.flush()
    db_session.add(OrderPick(item_id=item.id, section_id=section.id, quantity=5))
    db_session.commit()

    rows = service.get_orders(db_session)
    row = next(r for r in rows if r["id"] == "ORD-003")
    assert row["items"][0]["pickedFrom"] == [{"shelf": "Shelf 1", "quantity": 5}]
