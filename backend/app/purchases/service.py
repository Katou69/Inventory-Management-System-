from sqlalchemy.orm import Session

from app.dashboard.service import _fmt_date
from app.items.models import Product, Supplier
from app.purchases.models import PurchaseOrder
from app.zones.models import ZoneSection


def get_purchase_orders(db: Session) -> list[dict]:
    orders = db.query(PurchaseOrder).order_by(PurchaseOrder.placed_at.desc()).all()
    return [
        {
            "id": order.po_no,
            "supplier": db.get(Supplier, order.supplier_id).name if order.supplier_id else "",
            "items": [
                {
                    "product": db.get(Product, item.product_id).name,
                    "quantity": item.quantity,
                    "placedIn": [
                        {
                            "shelf": db.get(ZoneSection, placement.section_id).name,
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
