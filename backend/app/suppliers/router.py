from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.db.session import get_db
from app.items.models import Supplier
from app.suppliers.schemas import SupplierOut
from app.users.models import User

router = APIRouter(tags=["suppliers"])


@router.get("/suppliers", response_model=List[SupplierOut])
def list_suppliers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[Supplier]:
    return db.query(Supplier).order_by(Supplier.name).all()
