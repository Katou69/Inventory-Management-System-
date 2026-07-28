from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import require_role
from app.db.session import get_db
from app.users.models import User
from app.warehouses.models import Warehouse
from app.zones import service
from app.zones.models import Floor, LayoutRequest, ZoneSection, ZoneStockEntry
from app.zones.schemas import (
    DirectChangeRequest,
    FloorIn,
    FloorOut,
    FloorUpdate,
    ProposeChangeRequest,
    RejectRequest,
    ZoneChangeRequestOut,
    ZoneChangeStatus,
    ZoneSectionOut,
    ZoneStockEntryOut,
)

router = APIRouter(tags=["zones"])

# ponytail: fixed cap, not real pagination. The only caller asks for ?status=pending,
# which is bounded by review throughput -- it's the approved/rejected history that grows
# forever. Swap for a cursor if anyone needs to page through the full audit trail.
_MAX_LAYOUT_REQUESTS = 200


def _get_warehouse_or_404(db: Session, warehouse_id: int) -> Warehouse:
    warehouse = db.get(Warehouse, warehouse_id)
    if warehouse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    return warehouse


def _scoped_warehouse_or_403(db: Session, warehouse_id: int, user: User) -> Warehouse:
    """Warehouse the user is actually allowed to act on.

    require_role checks the ROLE but never the warehouse, so a manager of
    warehouse 1 could edit the layout of warehouse 3. Admins are global
    (warehouse_id NULL = all); everyone else is pinned to their assignment.
    """
    warehouse = _get_warehouse_or_404(db, warehouse_id)
    if user.role != "admin" and user.warehouse_id != warehouse_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this warehouse",
        )
    return warehouse


@router.get("/warehouses/{warehouse_id}/floors", response_model=List[FloorOut])
def list_floors(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[Floor]:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    return db.query(Floor).filter(Floor.warehouse_id == warehouse_id).order_by(Floor.level).all()


@router.post(
    "/warehouses/{warehouse_id}/floors",
    response_model=FloorOut,
    status_code=status.HTTP_201_CREATED,
)
def create_floor(
    warehouse_id: int,
    body: FloorIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
) -> Floor:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    return service.create_floor(db, warehouse_id, body.level, body.name)


@router.patch("/floors/{floor_id}", response_model=FloorOut)
def rename_floor(
    floor_id: int,
    body: FloorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
) -> Floor:
    floor = service.get_floor_or_404(db, floor_id)
    _scoped_warehouse_or_403(db, floor.warehouse_id, current_user)
    return service.rename_floor(db, floor, body.name)


@router.delete("/floors/{floor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_floor(
    floor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
) -> None:
    floor = service.get_floor_or_404(db, floor_id)
    _scoped_warehouse_or_403(db, floor.warehouse_id, current_user)
    service.delete_floor(db, floor)


@router.get("/warehouses/{warehouse_id}/zones", response_model=List[ZoneSectionOut])
def list_zones(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[ZoneSection]:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    return db.query(ZoneSection).filter(ZoneSection.warehouse_id == warehouse_id).all()


@router.get("/warehouses/{warehouse_id}/zone-stock", response_model=List[ZoneStockEntryOut])
def list_zone_stock(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[ZoneStockEntry]:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    return (
        db.query(ZoneStockEntry)
        .join(ZoneSection, ZoneStockEntry.section_id == ZoneSection.id)
        .filter(ZoneSection.warehouse_id == warehouse_id)
        .all()
    )


@router.get("/warehouses/{warehouse_id}/layout-requests", response_model=List[ZoneChangeRequestOut])
def list_layout_requests(
    warehouse_id: int,
    status_filter: Optional[ZoneChangeStatus] = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "staff")),
) -> List[LayoutRequest]:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    # selectinload: the response serialises request.items, which would otherwise
    # lazy-load one SELECT per request (1+N). This keeps it at 2 queries.
    query = (
        db.query(LayoutRequest)
        .options(selectinload(LayoutRequest.items))
        .filter(LayoutRequest.warehouse_id == warehouse_id)
    )
    if status_filter is not None:
        query = query.filter(LayoutRequest.status == status_filter)
    # This table only grows -- every layout edit ever made is a row, and nothing
    # prunes it. Newest first so the cap drops old history, not the pending work
    # an admin is here to review.
    return query.order_by(LayoutRequest.id.desc()).limit(_MAX_LAYOUT_REQUESTS).all()


@router.post(
    "/warehouses/{warehouse_id}/layout-requests/direct",
    response_model=ZoneChangeRequestOut,
    status_code=status.HTTP_201_CREATED,
)
def apply_direct_change(
    warehouse_id: int,
    body: DirectChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> LayoutRequest:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    return service.apply_direct(db, warehouse_id, body.item, current_user)


@router.post(
    "/warehouses/{warehouse_id}/layout-requests",
    response_model=ZoneChangeRequestOut,
    status_code=status.HTTP_201_CREATED,
)
def propose_change(
    warehouse_id: int,
    body: ProposeChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
) -> LayoutRequest:
    _scoped_warehouse_or_403(db, warehouse_id, current_user)
    return service.propose_change(db, warehouse_id, body.items, body.requestNote, current_user)


@router.post("/layout-requests/{request_id}/approve", status_code=status.HTTP_204_NO_CONTENT)
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> None:
    service.approve_request(db, request_id, current_user)


@router.post("/layout-requests/{request_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_request(
    request_id: int,
    body: RejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> None:
    service.reject_request(db, request_id, current_user, body.reviewNote)
