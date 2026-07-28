from sqlalchemy.orm import Session

from app.dashboard.service import _fmt_date
from app.items.models import Product
from app.orders.models import Order
from app.zones.models import ZoneSection


def get_orders(db: Session, warehouse_id: int | None = None) -> list[dict]:
    query = db.query(Order)
    if warehouse_id is not None:
        query = query.filter(Order.warehouse_id == warehouse_id)
    orders = query.order_by(Order.placed_at.desc()).all()
    return [
        {
            "id": order.order_no,
            "customer": order.customer_name,
            "items": [
                {
                    "product": db.get(Product, item.product_id).name,
                    "quantity": item.quantity,
                    "pickedFrom": [
                        {
                            "shelf": db.get(ZoneSection, pick.section_id).name,
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
