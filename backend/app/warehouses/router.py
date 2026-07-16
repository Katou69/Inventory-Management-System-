# Save as: backend/app/warehouses/router.py (replaces the "not yet implemented" stub)
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.db.session import get_db
from app.users.models import User
from app.warehouses.models import Warehouse
from app.warehouses.schemas import WarehouseOut

router = APIRouter(tags=["warehouses"])


@router.get("/warehouses", response_model=List[WarehouseOut])
def list_warehouses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[Warehouse]:
    """Admins see every warehouse (the Select Warehouse dropdown); managers
    and staff only see the one they're assigned to."""
    query = db.query(Warehouse)
    if current_user.role != "admin":
        query = query.filter(Warehouse.id == current_user.warehouse_id)
    return query.order_by(Warehouse.name).all()
