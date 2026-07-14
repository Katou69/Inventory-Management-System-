from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AuditMixin:
    """created/updated actor + timestamp columns.

    No soft delete: deletions are recorded in activity_events, so reads never
    need a `deleted_at IS NULL` filter (one missed filter in an aggregate would
    silently inflate a KPI).

    *_by is a nullable FK to users.id — null means a system/seed-generated row.
    """

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    created_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=_utcnow, nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
