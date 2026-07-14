from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.activity.models import ActivityEvent
from app.users.models import User


def log_event(
    db: Session,
    *,
    kind: str,
    title: str,
    description: str = "",
    actor: User | None = None,
    is_alert: bool = False,
    occurred_at: datetime | None = None,
) -> ActivityEvent:
    """Record one activity event. Call from the write sites of mutating services.

    Does NOT commit — it joins the caller's transaction, so an event is never
    logged for a write that later rolls back.
    """
    event = ActivityEvent(
        actor_id=actor.id if actor else None,
        actor_name=actor.name if actor else "System",
        actor_role=actor.role if actor else "system",
        kind=kind,
        title=title,
        description=description,
        is_alert=is_alert,
        occurred_at=occurred_at or datetime.now(timezone.utc),
    )
    db.add(event)
    return event
