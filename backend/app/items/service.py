from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.items.models import MovementTask, Product, StockMovement
from app.users.models import User
from app.zones.models import ZoneSection, ZoneStockEntry

RANGE_DAYS = {"7d": 7, "30d": 30}


def _product_stock_in_warehouse(db: Session, product_id: int, warehouse_id: int) -> int:
    """On-hand quantity = SUM(signed quantity) over the ledger, per the
    StockMovement model's own docstring. This is the source of truth, not
    ZoneStockEntry (which is only a per-shelf read cache)."""
    total = (
        db.query(func.coalesce(func.sum(StockMovement.quantity), 0))
        .filter(StockMovement.product_id == product_id, StockMovement.warehouse_id == warehouse_id)
        .scalar()
    )
    return int(total or 0)


def _status_for(stock: int, reorder_level: int) -> str:
    if stock <= 0:
        return "out_of_stock"
    if stock <= reorder_level:
        return "low_stock"
    return "in_stock"


def list_inventory(db: Session, warehouse_id: int) -> list[dict]:
    products = db.query(Product).all()
    rows = []
    for product in products:
        stock = _product_stock_in_warehouse(db, product.id, warehouse_id)
        rows.append(
            {
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "price": float(product.unit_price),
                "category": product.category_name,
                "supplier": product.supplier.name if product.supplier else "",
                "supplierId": product.supplier_id,
                "stock": stock,
                "minStock": product.reorder_level,
                "status": _status_for(stock, product.reorder_level),
            }
        )
    return rows


def inventory_stats(db: Session, warehouse_id: int) -> dict:
    rows = list_inventory(db, warehouse_id)
    return {
        "totalItems": len(rows),
        "lowStock": sum(1 for r in rows if r["status"] == "low_stock"),
        "outOfStock": sum(1 for r in rows if r["status"] == "out_of_stock"),
    }


def product_history(
    db: Session, product_id: int, warehouse_id: int, range_key: Optional[str]
) -> list[StockMovement]:
    query = db.query(StockMovement).filter(
        StockMovement.product_id == product_id,
        StockMovement.warehouse_id == warehouse_id,
    )
    if range_key in RANGE_DAYS:
        cutoff = datetime.now(timezone.utc) - timedelta(days=RANGE_DAYS[range_key])
        query = query.filter(StockMovement.occurred_at >= cutoff)
    return query.order_by(StockMovement.occurred_at.desc()).all()


def create_movement_task(
    db: Session,
    warehouse_id: int,
    product_id: int,
    quantity: int,
    from_section_id: int,
    to_section_id: int,
    reason: str,
    requested_by: User,
) -> MovementTask:
    if from_section_id == to_section_id:
        raise ValueError("From and to shelf must be different")
    if quantity <= 0:
        raise ValueError("Quantity must be positive")

    on_shelf = (
        db.query(ZoneStockEntry.quantity)
        .filter(ZoneStockEntry.section_id == from_section_id, ZoneStockEntry.product_id == product_id)
        .scalar()
    ) or 0

    # Stock already claimed by OTHER pending tasks pulling from this same
    # shelf. Without this, two tasks can each pass validation against the
    # same untouched balance — since only *completing* a task moves stock —
    # and only go negative once both get completed later.
    already_reserved_out = (
        db.query(func.coalesce(func.sum(MovementTask.quantity), 0))
        .filter(
            MovementTask.from_section_id == from_section_id,
            MovementTask.product_id == product_id,
            MovementTask.status == "pending",
        )
        .scalar()
    ) or 0

    free_to_reserve = on_shelf - already_reserved_out
    if free_to_reserve < quantity:
        raise ValueError(
            f"Not enough unreserved stock on the selected shelf "
            f"({free_to_reserve} available, {quantity} requested)"
        )

    # Same idea for the destination: don't let a shelf get overbooked past
    # its capacity by several pending tasks that haven't landed yet.
    to_capacity = db.query(ZoneSection.capacity).filter(ZoneSection.id == to_section_id).scalar()
    to_occupied = (
        db.query(func.coalesce(func.sum(ZoneStockEntry.quantity), 0))
        .filter(ZoneStockEntry.section_id == to_section_id)
        .scalar()
    ) or 0
    already_reserved_in = (
        db.query(func.coalesce(func.sum(MovementTask.quantity), 0))
        .filter(MovementTask.to_section_id == to_section_id, MovementTask.status == "pending")
        .scalar()
    ) or 0
    free_space = (to_capacity or 0) - to_occupied - already_reserved_in
    if free_space < quantity:
        raise ValueError(
            f"Not enough free space on the destination shelf "
            f"({free_space} free, {quantity} requested)"
        )

    task = MovementTask(
        product_id=product_id,
        warehouse_id=warehouse_id,
        from_section_id=from_section_id,
        to_section_id=to_section_id,
        quantity=quantity,
        requested_by=requested_by.id,
        reason=reason,
        status="pending",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def complete_movement_task(db: Session, task: MovementTask, completed_by: User) -> MovementTask:
    if task.status != "pending":
        raise ValueError("Task is not pending")

    from_section = db.get(ZoneSection, task.from_section_id)
    to_section = db.get(ZoneSection, task.to_section_id)
    if from_section is None or to_section is None:
        raise ValueError("Shelf on this task no longer exists")

    from_entry = (
        db.query(ZoneStockEntry)
        .filter(ZoneStockEntry.section_id == task.from_section_id, ZoneStockEntry.product_id == task.product_id)
        .first()
    )
    if not from_entry or from_entry.quantity < task.quantity:
        raise ValueError("Not enough stock on the source shelf to complete this task")

    now = datetime.now(timezone.utc)
    note = f"{task.quantity} units moved from {from_section.name} to {to_section.name}"

    db.add(
        StockMovement(
            product_id=task.product_id,
            warehouse_id=task.warehouse_id,
            section_id=task.from_section_id,
            kind="transfer_out",
            quantity=-task.quantity,
            occurred_at=now,
            note=note,
        )
    )
    db.add(
        StockMovement(
            product_id=task.product_id,
            warehouse_id=task.warehouse_id,
            section_id=task.to_section_id,
            kind="transfer_in",
            quantity=task.quantity,
            occurred_at=now,
            note=note,
        )
    )

    from_entry.quantity -= task.quantity

    to_entry = (
        db.query(ZoneStockEntry)
        .filter(ZoneStockEntry.section_id == task.to_section_id, ZoneStockEntry.product_id == task.product_id)
        .first()
    )
    if to_entry:
        to_entry.quantity += task.quantity
    else:
        db.add(ZoneStockEntry(section_id=task.to_section_id, product_id=task.product_id, quantity=task.quantity))

    task.status = "completed"
    task.updated_by = completed_by.id
    db.commit()
    db.refresh(task)
    return task
