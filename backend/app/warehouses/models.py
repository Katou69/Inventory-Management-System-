from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.mixins import AuditMixin
from app.db.session import Base


class Warehouse(Base, AuditMixin):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)  # "WH-001"
    location: Mapped[str] = mapped_column(String, nullable=False, default="")
    # `manager` is the display name the API/UI already read; manager_id is the real
    # link. Kept both: managers are often recorded before they have a user account.
    manager: Mapped[str] = mapped_column(String, nullable=False, default="")
    manager_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True, index=True)
    image: Mapped[str] = mapped_column(String, nullable=False, default="/images/ellipse-2.png")
    capacity_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")  # active|maintenance|closed
    last_inspection: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_inspection: Mapped[date | None] = mapped_column(Date, nullable=True)
    phone: Mapped[str] = mapped_column(String, nullable=False, default="")
    email: Mapped[str] = mapped_column(String, nullable=False, default="")

    # capacity_used is NOT stored — it is SUM(stock_movements.quantity) for this
    # warehouse. Storing it would let it drift out of sync with its own ledger.
