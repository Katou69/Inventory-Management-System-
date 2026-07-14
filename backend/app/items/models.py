from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin
from app.db.session import Base


class Supplier(Base, AuditMixin):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    contact_email: Mapped[str | None] = mapped_column(String, nullable=True)


class Product(Base, AuditMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sku: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    image: Mapped[str] = mapped_column(String, nullable=False, default="/images/ellipse-2.png")
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    supplier_id: Mapped[int | None] = mapped_column(ForeignKey("suppliers.id"), nullable=True, index=True)

    supplier: Mapped["Supplier | None"] = relationship()


class StockMovement(Base, AuditMixin):
    """The inventory ledger — the single source of truth for on-hand quantity.

    quantity is SIGNED: positive = into the warehouse, negative = out. On-hand
    for any product/warehouse is SUM(quantity), so there is no separate stock
    table that can drift out of sync with its own history.
    """

    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String, nullable=False)  # inbound|outbound|transfer_in|transfer_out|adjustment
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)  # signed: + into warehouse, - out
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(timezone.utc)
    )
    note: Mapped[str | None] = mapped_column(String, nullable=True)

    product: Mapped["Product"] = relationship()
