from sqlalchemy.orm import Session, selectinload

from app.dashboard.service import _fmt_date
from app.items.models import Product
from app.orders.models import Order, OrderItem
from app.zones.models import ZoneSection


def get_orders(db: Session, warehouse_id: int | None = None) -> list[dict]:
    # selectinload both levels: without this, order.items is one query per
    # order, item.picks is one query per item, and the db.get() lookups below
    # were one query per item/pick on top of that -- a page of orders could
    # run into the hundreds of queries. This brings it down to a fixed number
    # regardless of how many orders/items/picks are on the page.
    query = db.query(Order).options(selectinload(Order.items).selectinload(OrderItem.picks))
    if warehouse_id is not None:
        query = query.filter(Order.warehouse_id == warehouse_id)
    orders = query.order_by(Order.placed_at.desc()).all()

    product_ids = {item.product_id for order in orders for item in order.items}
    section_ids = {pick.section_id for order in orders for item in order.items for pick in item.picks}
    product_names = dict(db.query(Product.id, Product.name).filter(Product.id.in_(product_ids)).all()) if product_ids else {}
    section_names = dict(db.query(ZoneSection.id, ZoneSection.name).filter(ZoneSection.id.in_(section_ids)).all()) if section_ids else {}

    return [
        {
            "id": order.order_no,
            "customer": order.customer_name,
            "items": [
                {
                    "product": product_names.get(item.product_id, "Unknown product"),
                    "quantity": item.quantity,
                    "pickedFrom": [
                        {
                            "shelf": section_names.get(pick.section_id, "Unknown shelf"),
                            "quantity": pick.quantity,
                        }
                        for pick in item.picks
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
