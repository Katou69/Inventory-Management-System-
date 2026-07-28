"""Purchase orders endpoint tests."""

from datetime import date

from app.items.models import Product, Supplier
from app.purchases import service
from app.purchases.models import PurchaseOrder, PurchaseOrderItem, PurchasePlacement
from app.warehouses.models import Warehouse
from app.zones.models import ZoneSection


def _setup(db):
    wh = Warehouse(id=1, name="Test WH", code="WH-001")
    db.add(wh)
    supplier = Supplier(name="Acme Supply")
    db.add(supplier)
    widget = Product(sku="SKU-1", name="Widget", unit_price=10, unit_cost=4, reorder_level=5)
    db.add(widget)
    section = ZoneSection(warehouse_id=1, kind="shelf", code="S1", name="Shelf 1",
                           x=0, y=0, width=1, height=1, capacity=100)
    db.add(section)
    db.flush()
    return supplier, widget, section


def test_get_purchase_orders_with_no_items_returns_empty_list(db_session):
    supplier, _widget, _section = _setup(db_session)
    db_session.add(
        PurchaseOrder(po_no="PO-001", supplier_id=supplier.id, total=0, placed_at=date(2026, 1, 1))
    )
    db_session.commit()

    rows = service.get_purchase_orders(db_session)
    assert rows[0]["id"] == "PO-001"
    assert rows[0]["supplier"] == "Acme Supply"
    assert rows[0]["items"] == []


def test_get_purchase_orders_without_supplier_returns_empty_string(db_session):
    db_session.add(PurchaseOrder(po_no="PO-002", total=0, placed_at=date(2026, 1, 2)))
    db_session.commit()

    rows = service.get_purchase_orders(db_session)
    row = next(r for r in rows if r["id"] == "PO-002")
    assert row["supplier"] == ""


def test_get_purchase_orders_item_without_placements_has_empty_placedin(db_session):
    supplier, widget, _section = _setup(db_session)
    po = PurchaseOrder(po_no="PO-003", supplier_id=supplier.id, total=100, placed_at=date(2026, 1, 3))
    db_session.add(po)
    db_session.flush()
    db_session.add(PurchaseOrderItem(purchase_id=po.id, product_id=widget.id, quantity=5))
    db_session.commit()

    rows = service.get_purchase_orders(db_session)
    row = next(r for r in rows if r["id"] == "PO-003")
    assert row["items"] == [{"product": "Widget", "quantity": 5, "placedIn": []}]


def test_get_purchase_orders_resolves_placed_shelf_names(db_session):
    supplier, widget, section = _setup(db_session)
    po = PurchaseOrder(po_no="PO-004", supplier_id=supplier.id, total=50, placed_at=date(2026, 1, 4))
    db_session.add(po)
    db_session.flush()
    item = PurchaseOrderItem(purchase_id=po.id, product_id=widget.id, quantity=5)
    db_session.add(item)
    db_session.flush()
    db_session.add(PurchasePlacement(item_id=item.id, section_id=section.id, quantity=5))
    db_session.commit()

    rows = service.get_purchase_orders(db_session)
    row = next(r for r in rows if r["id"] == "PO-004")
    assert row["items"][0]["placedIn"] == [{"shelf": "Shelf 1", "quantity": 5}]
