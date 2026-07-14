import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _new_id() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)  # "admin" | "manager" | "staff"
    # NULL means "all warehouses" — that was the old "all" sentinel string.
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")  # "pending" | "active" | "inactive"
    joined_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lockout_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    settings: Mapped["UserSetting | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )


class UserSetting(Base):
    """Per-user preferences from the Settings page. Separate from app_settings,
    which is app-wide key/value (sales_target)."""

    __tablename__ = "user_settings"

    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), primary_key=True)
    notify_low_stock: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_order_update: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_po_approval: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    language: Mapped[str] = mapped_column(String, nullable=False, default="English")
    timezone: Mapped[str] = mapped_column(String, nullable=False, default="UTC")

    user: Mapped["User"] = relationship(back_populates="settings")
