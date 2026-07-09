import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, String, Integer
from sqlalchemy.orm import Mapped, mapped_column

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
    warehouse_id: Mapped[str] = mapped_column(String, nullable=False)  # numeric id as string, or "all"
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")  # "pending" | "active" | "inactive"
    joined_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lockout_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
