from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.mixins import AuditMixin
from app.db.session import Base


class Order(Base, AuditMixin):
    """Order header only — no line items this pass.

    Revenue and sales counts aggregate off `total` / `id`. Top-product revenue
    comes from outbound StockMovement x Product.unit_price, so the dashboard
    needs no line-item table.
    """

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_no: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)  # "ORD-0001"
    customer_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")  # pending|fulfilled|cancelled
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    placed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(timezone.utc)
    )
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"), nullable=True, index=True)
