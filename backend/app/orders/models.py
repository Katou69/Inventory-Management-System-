from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin
from app.db.session import Base


class Order(Base, AuditMixin):
    """Sales order header.

    status follows the frontend's flow: `picking` is the state the Move-to-Ship
    modal transitions into, so it must be storable.
    """

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_no: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)  # "ORD-0001"
    customer_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(
        String, nullable=False, default="pending"
    )  # pending|picking|completed|cancelled
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    placed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(timezone.utc)
    )
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"), nullable=True, index=True)

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base, AuditMixin):
    __tablename__ = "order_items"
    __table_args__ = (CheckConstraint("quantity > 0", name="ck_order_items_qty_positive"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
    picks: Mapped[list["OrderPick"]] = relationship(back_populates="item", cascade="all, delete-orphan")


class OrderPick(Base, AuditMixin):
    """Which shelf a line was picked from, and how much. One line can be picked
    across several shelves — this is the frontend's `OrderItem.pickedFrom[]`."""

    __tablename__ = "order_picks"
    __table_args__ = (CheckConstraint("quantity > 0", name="ck_order_picks_qty_positive"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"), nullable=False, index=True)
    section_id: Mapped[int] = mapped_column(ForeignKey("zone_sections.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    item: Mapped["OrderItem"] = relationship(back_populates="picks")
