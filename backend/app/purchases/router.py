from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.db.session import get_db
from app.purchases import service
from app.purchases.schemas import PurchaseOrderOut
from app.users.models import User

router = APIRouter(tags=["purchases"])


@router.get("/purchase-orders", response_model=List[PurchaseOrderOut])
def list_purchase_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[dict]:
    # Same scoping as /orders: admins see everything, everyone else only
    # their own warehouse's purchase orders.
    warehouse_id = None if current_user.role == "admin" else current_user.warehouse_id
    return service.get_purchase_orders(db, warehouse_id)
