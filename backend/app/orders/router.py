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
    return service.get_orders(db)
