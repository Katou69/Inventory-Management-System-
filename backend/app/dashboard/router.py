from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from . import service
from app.dashboard.schemas import (
    InventoryDataPointOut,
    ProductOut,
    StatusCardOut,
    WarehouseDetailOut,
    SalesOverview,
    SalesGoalIn,
    ActivityEntryOut,
    WarehouseOut,
    CreateWarehouseIn,
    UpdateWarehouseProfileIn,
    NotificationOut,
    SearchIndexOut,
    StaffStatOut,
)
from app.db.session import get_db
from app.users.models import User
from app.warehouses.models import Warehouse

router = APIRouter(tags=["dashboard"])


def _get_warehouse_or_404(db: Session, warehouse_id: int) -> Warehouse:
    warehouse = db.get(Warehouse, warehouse_id)
    if warehouse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    return warehouse


@router.get("/status-cards", response_model=List[StatusCardOut])
def status_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> list[dict]:
    return service.get_status_cards(db)


@router.get("/inventory-statistics", response_model=dict[str, List[InventoryDataPointOut]])
def inventory_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> dict[str, list[dict]]:
    return service.get_inventory_statistics(db)


@router.get("/products/top", response_model=List[ProductOut])
def top_products(
    period: str = Query(default="This month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> list[dict]:
    return service.get_top_products(db, period)


@router.get("/warehouses/public", response_model=List[dict])
def get_warehouses_public(db: Session = Depends(get_db)) -> List[dict]:
    """Warehouse id + name only, no auth required.

    The signup form must let a new user pick their warehouse, and by definition
    they have no session yet. Deliberately minimal — serving the full WarehouseOut
    (capacity, manager, phone, email) to anonymous callers would leak operational
    detail to anyone who can load the login page.

    Declared BEFORE /warehouses/{warehouse_id} or FastAPI matches "public" as an int.
    """
    return [{"id": w["id"], "name": w["name"]} for w in service.get_warehouses(db)]


@router.get("/warehouses/{warehouse_id}", response_model=WarehouseDetailOut)
def warehouse_detail(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> dict:
    warehouse = _get_warehouse_or_404(db, warehouse_id)
    return service.get_warehouse_detail(db, warehouse)

@router.get("/sales/overview", response_model=SalesOverview)
def sales_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin","manager"))
)-> dict:
    return service.get_sales_overview(db)
    
@router.put("/sales/goal", response_model=SalesOverview)
def update_sales_goal(
    body: SalesGoalIn,
    db : Session= Depends(get_db),
    current_user : User = Depends(require_role("admin"))
)->dict:
    return service.update_sales_goal(db,body.target)

@router.get("/activities", response_model=List[ActivityEntryOut])
def get_activities(
    db: Session = Depends(get_db),
    current_user : User = Depends(require_role("admin","manager"))
)->List[dict]:
    return service.get_activities(db)

@router.get("/warehouses", response_model=List[WarehouseOut])
def get_warehouses(
    db: Session = Depends(get_db),
    current_user : User= Depends(require_role("admin", "manager", "staff"))
)->List[dict]:
    return service.get_warehouses(db)

@router.post("/warehouses", response_model=WarehouseOut, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    body: CreateWarehouseIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> dict:
    return service.create_warehouse(db, body, current_user)


@router.put("/warehouses/{warehouse_id}/profile", response_model=UpdateWarehouseProfileIn)
def update_warehouse_profile(
    warehouse_id: int,
    body: UpdateWarehouseProfileIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
) -> dict:
    warehouse = _get_warehouse_or_404(db, warehouse_id)
    return service.update_warehouse_profile(db, warehouse, body, current_user)


@router.get("/notifications", response_model=List[NotificationOut])
def notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[dict]:
    return service.get_notifications(db, current_user)


# Declared before /notifications/{id}/read so "read-all" is not swallowed as an id.
@router.post("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> None:
    service.mark_all_notifications_read(db, current_user)


@router.post("/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> None:
    service.mark_notification_read(db, current_user, notification_id)


@router.get("/search-index", response_model=SearchIndexOut)
def search_index(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> dict:
    return service.get_search_index(db)


@router.get("/staff/stats", response_model=List[StaffStatOut])
def staff_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[dict]:
    return service.get_staff_stats(db, current_user)
