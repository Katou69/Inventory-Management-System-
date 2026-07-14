from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.activity.service import log_event
from app.users.models import User
from app.zones.models import LayoutRequest, LayoutRequestItem, ZoneSection
from app.zones.schemas import ZoneChangeItemIn


def _describe(items: list[ZoneChangeItemIn] | list[LayoutRequestItem]) -> str:
    """"2 updates, 1 delete" — a human summary of a batch for the activity feed."""
    counts: dict[str, int] = {}
    for item in items:
        action = getattr(item, "actionType", None) or getattr(item, "action_type", "")
        counts[action] = counts.get(action, 0) + 1
    order = ("create", "update", "delete")
    parts = [
        f"{counts[a]} {a}{'s' if counts[a] > 1 else ''}"
        for a in order
        if counts.get(a)
    ]
    return ", ".join(parts) or "no changes"


def _apply_item_to_section(db: Session, warehouse_id: int, item: ZoneChangeItemIn) -> None:
    """Apply one create/update/delete item to ZoneSection. Shared by apply_direct and approve_request."""
    if item.actionType == "create":
        proposed = item.proposedData
        section = ZoneSection(
            warehouse_id=warehouse_id,
            kind=proposed.kind if proposed else "shelf",
            code=proposed.code if proposed else "",
            name=proposed.name if proposed else "",
            x=proposed.x if proposed and proposed.x is not None else 0,
            y=proposed.y if proposed and proposed.y is not None else 0,
            width=proposed.width if proposed and proposed.width is not None else 0,
            height=proposed.height if proposed and proposed.height is not None else 0,
            capacity=proposed.capacity if proposed and proposed.capacity is not None else 0,
        )
        db.add(section)
        return

    section = db.get(ZoneSection, item.sectionId) if item.sectionId is not None else None
    if section is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone section not found")

    if item.actionType == "delete":
        db.delete(section)
        return

    # update
    proposed = item.proposedData
    if proposed is None:
        return
    for field, value in proposed.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(section, field, value)


def apply_direct(
    db: Session, warehouse_id: int, item: ZoneChangeItemIn, actor: User
) -> LayoutRequest:
    """Admin path: applied live immediately, logged as a self-approved request."""
    now = datetime.now(timezone.utc)
    request = LayoutRequest(
        warehouse_id=warehouse_id,
        requested_by=actor.id,
        request_note=None,
        status="approved",
        reviewed_by=actor.id,
        reviewed_at=now,
    )
    db.add(request)
    db.flush()

    db.add(
        LayoutRequestItem(
            request_id=request.id,
            action_type=item.actionType,
            section_id=item.sectionId,
            proposed_data=item.proposedData.model_dump(exclude_unset=True) if item.proposedData else None,
            previous_data=item.previousData.model_dump(exclude_unset=True) if item.previousData else None,
        )
    )

    _apply_item_to_section(db, warehouse_id, item)

    # Feed-only (is_alert stays False): an admin editing the layout needs nobody's
    # attention. "alert" is the event *kind* -- the notification schema's kinds are
    # a closed set (stock|order|alert|user), so layout events ride on "alert".
    log_event(
        db,
        kind="alert",
        title="Layout updated",
        description=f"Applied {_describe([item])} to the warehouse layout",
        actor=actor,
    )

    db.commit()
    db.refresh(request)
    return request


def propose_change(
    db: Session,
    warehouse_id: int,
    items: list[ZoneChangeItemIn],
    request_note: str | None,
    actor: User,
) -> LayoutRequest:
    """Manager path: a pending batch. Sections are untouched until an admin reviews."""
    if not items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A proposal must contain at least one change",
        )
    if not (request_note or "").strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A message describing the change is required",
        )

    request = LayoutRequest(
        warehouse_id=warehouse_id,
        requested_by=actor.id,
        request_note=request_note,
        status="pending",
    )
    db.add(request)
    db.flush()

    for item in items:
        db.add(
            LayoutRequestItem(
                request_id=request.id,
                action_type=item.actionType,
                section_id=item.sectionId,
                proposed_data=item.proposedData.model_dump(exclude_unset=True) if item.proposedData else None,
                previous_data=item.previousData.model_dump(exclude_unset=True) if item.previousData else None,
            )
        )

    # is_alert: this is the notification that tells an admin a review is waiting.
    # Without it a proposal sat pending forever with nobody told.
    log_event(
        db,
        kind="alert",
        title="Layout change proposed",
        description=f"{actor.name} proposed {_describe(items)}: {request_note}",
        actor=actor,
        is_alert=True,
    )

    db.commit()
    db.refresh(request)
    return request


def _get_pending_request(db: Session, request_id: int) -> LayoutRequest:
    request = db.get(LayoutRequest, request_id)
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Layout request not found")
    if request.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Layout request already reviewed")
    return request


def approve_request(db: Session, request_id: int, actor: User) -> None:
    request = _get_pending_request(db, request_id)

    for row in request.items:
        item = ZoneChangeItemIn(
            actionType=row.action_type,
            sectionId=row.section_id,
            proposedData=row.proposed_data,
            previousData=row.previous_data,
        )
        _apply_item_to_section(db, request.warehouse_id, item)

    request.status = "approved"
    request.reviewed_by = actor.id
    request.reviewed_at = datetime.now(timezone.utc)

    # is_alert: closes the loop for the manager who is waiting on the decision.
    log_event(
        db,
        kind="alert",
        title="Layout change approved",
        description=f"{actor.name} approved a layout proposal ({_describe(request.items)})",
        actor=actor,
        is_alert=True,
    )
    db.commit()


def reject_request(db: Session, request_id: int, actor: User, review_note: str) -> None:
    if not review_note.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A review note explaining the rejection is required",
        )
    request = _get_pending_request(db, request_id)
    request.status = "rejected"
    request.reviewed_by = actor.id
    request.reviewed_at = datetime.now(timezone.utc)
    request.review_note = review_note

    log_event(
        db,
        kind="alert",
        title="Layout change rejected",
        description=f"{actor.name} rejected a layout proposal: {review_note}",
        actor=actor,
        is_alert=True,
    )
    db.commit()
