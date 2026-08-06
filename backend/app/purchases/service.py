from sqlalchemy.orm import Session, selectinload

from app.dashboard.service import _fmt_date
from app.items.models import Product, Supplier
from app.purchases.models import PurchaseOrder, PurchaseOrderItem
from app.zones.models import ZoneSection


def get_purchase_orders(db: Session, warehouse_id: int | None = None) -> list[dict]:
    # selectinload both levels: without this, order.items is one query per
    # order and item.placements is one query per item, and the db.get()
    # lookups below were one query per item/placement/order on top of that.
    # This brings it down to a fixed number of queries regardless of how many
    # orders/items/placements are on the page.
    query = db.query(PurchaseOrder).options(
        selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.placements)
    )
    if warehouse_id is not None:
        query = query.filter(PurchaseOrder.warehouse_id == warehouse_id)
    orders = query.order_by(PurchaseOrder.placed_at.desc()).all()

    supplier_ids = {order.supplier_id for order in orders if order.supplier_id}
    product_ids = {item.product_id for order in orders for item in order.items}
    section_ids = {p.section_id for order in orders for item in order.items for p in item.placements}
    supplier_names = dict(db.query(Supplier.id, Supplier.name).filter(Supplier.id.in_(supplier_ids)).all()) if supplier_ids else {}
    product_names = dict(db.query(Product.id, Product.name).filter(Product.id.in_(product_ids)).all()) if product_ids else {}
    section_names = dict(db.query(ZoneSection.id, ZoneSection.name).filter(ZoneSection.id.in_(section_ids)).all()) if section_ids else {}

    return [
        {
            "id": order.po_no,
            "supplier": supplier_names.get(order.supplier_id, "") if order.supplier_id else "",
            "items": [
                {
                    "product": product_names.get(item.product_id, "Unknown product"),
                    "quantity": item.quantity,
                    "placedIn": [
                        {
                            "shelf": section_names.get(placement.section_id, "Unknown shelf"),
                            "quantity": placement.quantity,
                        }
                        for placement in item.placements
                    ],
                }
                for item in order.items
            ],
            "total": float(order.total),
            "status": order.status,
            "date": _fmt_date(order.placed_at),
        }
        for order in orders
    ]
