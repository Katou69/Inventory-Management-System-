# Save as: backend/app/items/router.py (replaces the "not yet implemented" stub)
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.db.session import get_db
from app.items import service
from app.items.models import MovementTask, Product
from app.items.schemas import (
    InventoryStatsOut,
    MovementTaskCreateRequest,
    MovementTaskOut,
    ProductInventoryOut,
    ProductOut,
    ProductUpdateRequest,
    StockMovementOut,
)
from app.users.models import User
from app.warehouses.models import Warehouse
from app.zones.models import ZoneSection

router = APIRouter(tags=["items"])


def _scoped_warehouse_or_403(db: Session, warehouse_id: int, user: User) -> Warehouse:
    """Same pattern as zones/router.py: admins are global, everyone else is
    pinned to their assigned warehouse."""
    warehouse = db.get(Warehouse, warehouse_id)
    if warehouse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    if user.role != "admin" and user.warehouse_id != warehouse_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this warehouse")
    return warehouse


def _movement_task_to_out(db: Session, task: MovementTask, requester_name: str) -> dict:
    from_section = db.get(ZoneSection, task.from_section_id)
    to_section = db.get(ZoneSection, task.to_section_id)
    return {
        "id": task.id,
        "productId": task.product_id,
        "productName": task.product.name,
        "quantity": task.quantity,
        "fromShelf": from_section.name if from_section else "",
        "toShelf": to_section.name if to_section else "",
        "requestedBy": requester_name,
        "reason": task.reason,
        "status": task.status,
    }


@router.get("/warehouses/{warehouse_id}/inventory", response_model=List[ProductInventoryOut])
def list_inventory(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[dict]:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    return service.list_inventory(db, warehouse_id)


@router.get("/warehouses/{warehouse_id}/inventory/stats", response_model=InventoryStatsOut)
def inventory_stats(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> dict:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    return service.inventory_stats(db, warehouse_id)


@router.patch("/items/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    body: ProductUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if body.name is not None:
        product.name = body.name
    if body.price is not None:
        product.unit_price = body.price
    if body.minStock is not None:
        product.reorder_level = body.minStock
    product.updated_by = current_user.id

    db.commit()
    db.refresh(product)
    return product


@router.get("/items/{product_id}/history", response_model=List[StockMovementOut])
def product_history(
    product_id: int,
    warehouse_id: int = Query(...),
    range: Optional[str] = Query(default=None, description="7d | 30d | omit for all time"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[dict]:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    movements = service.product_history(db, product_id, warehouse_id, range)
    return [
        {
            "id": m.id,
            "kind": m.kind,
            "quantity": m.quantity,
            "occurredAt": m.occurred_at,
            "note": m.note or "",
        }
        for m in movements
    ]


@router.get("/warehouses/{warehouse_id}/movement-tasks", response_model=List[MovementTaskOut])
def list_movement_tasks(
    warehouse_id: int,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[dict]:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)

    query = db.query(MovementTask).filter(MovementTask.warehouse_id == warehouse_id)
    if status_filter:
        query = query.filter(MovementTask.status == status_filter)
    tasks = query.order_by(MovementTask.created_at.desc()).all()

    user_ids = {t.requested_by for t in tasks if t.requested_by}
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}

    return [
        _movement_task_to_out(
            db, t, users_by_id[t.requested_by].name if t.requested_by in users_by_id else "Unknown"
        )
        for t in tasks
    ]


@router.post(
    "/warehouses/{warehouse_id}/movement-tasks",
    response_model=MovementTaskOut,
    status_code=status.HTTP_201_CREATED,
)
def create_movement_task(
    warehouse_id: int,
    body: MovementTaskCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
) -> dict:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    try:
        task = service.create_movement_task(
            db,
            warehouse_id=warehouse_id,
            product_id=body.productId,
            quantity=body.quantity,
            from_section_id=body.fromShelfId,
            to_section_id=body.toShelfId,
            reason=body.reason,
            requested_by=current_user,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return _movement_task_to_out(db, task, current_user.name)


@router.post("/movement-tasks/{task_id}/complete", response_model=MovementTaskOut)
def complete_movement_task(
    task_id: int,
    db: Session = Depends(get_db),
    # NOTE: allowing all three roles to complete a task, since the admin
    # inventory page you described shows the Complete Task button directly.
    # The model's docstring says "staff completes" — tighten this to
    # require_role("staff") if that's actually the intended workflow.
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> dict:
    task = db.get(MovementTask, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movement task not found")
    _scoped_warehouse_or_403(db, task.warehouse_id, current_user)

    try:
        task = service.complete_movement_task(db, task, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    requester = db.get(User, task.requested_by) if task.requested_by else None
    return _movement_task_to_out(db, task, requester.name if requester else "Unknown")
