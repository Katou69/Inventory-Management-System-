from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.db.session import get_db
from app.orders import service
from app.orders.schemas import OrderOut
from app.users.models import User

router = APIRouter(tags=["orders"])


@router.get("/orders", response_model=List[OrderOut])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[dict]:
    # Admins are global (warehouse_id NULL); everyone else only sees their own
    # warehouse's orders — without this a staff/manager could see every
    # warehouse's customer orders just by hitting this endpoint.
    warehouse_id = None if current_user.role == "admin" else current_user.warehouse_id
    return service.get_orders(db, warehouse_id)
