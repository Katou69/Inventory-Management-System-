from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.mixins import AuditMixin
from app.db.session import Base


class ActivityEvent(Base, AuditMixin):
    """Feeds both the activity feed and the notification bell.

    One table, two views: the feed shows everything, notifications show only
    rows with is_alert. actor_name/actor_role are denormalized so the feed still
    renders correctly after a user is deleted (this table IS the deletion record
    — see AuditMixin's note on why there is no soft delete).
    """

    __tablename__ = "activity_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True, index=True)
    actor_name: Mapped[str] = mapped_column(String, nullable=False, default="System")
    actor_role: Mapped[str] = mapped_column(String, nullable=False, default="system")
    kind: Mapped[str] = mapped_column(String, nullable=False)  # stock|order|alert|user
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False, default="")
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(timezone.utc)
    )
    is_alert: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class NotificationRead(Base, AuditMixin):
    """Per-user read state. Not a bool on the event — two users reading the same
    alert must not clobber each other's unread badge."""

    __tablename__ = "notification_reads"
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_notification_read"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("activity_events.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    read_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
