from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin
from app.db.session import Base


class Category(Base, AuditMixin):
    """Product category. A table rather than a free string on Product because the
    Settings page edits the category list."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)


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
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True, index=True)
    supplier_id: Mapped[int | None] = mapped_column(ForeignKey("suppliers.id"), nullable=True, index=True)
    image: Mapped[str] = mapped_column(String, nullable=False, default="/images/ellipse-2.png")
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # frontend calls this minStock

    category: Mapped["Category | None"] = relationship(lazy="joined")
    supplier: Mapped["Supplier | None"] = relationship()

    @property
    def category_name(self) -> str:
        """Display string. The API has always emitted `category` as a name."""
        return self.category.name if self.category else ""


class StockMovement(Base, AuditMixin):
    """The inventory ledger — the single source of truth for on-hand quantity.

    quantity is SIGNED: positive = into the warehouse, negative = out. On-hand
    for any product/warehouse is SUM(quantity), so there is no separate stock
    table that can drift out of sync with its own history.

    section_id is the shelf the stock landed on / came off (nullable: a
    warehouse-level adjustment has no shelf). Shelf occupancy is therefore
    SUM(quantity) WHERE section_id = X — the same ledger the warehouse total
    comes from, so shelf and warehouse stock cannot drift apart.
    """

    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False, index=True)
    section_id: Mapped[int | None] = mapped_column(ForeignKey("zone_sections.id"), nullable=True, index=True)
    kind: Mapped[str] = mapped_column(String, nullable=False)  # inbound|outbound|transfer_in|transfer_out|adjustment
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)  # signed: + into warehouse, - out
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(timezone.utc)
    )
    note: Mapped[str | None] = mapped_column(String, nullable=True)

    product: Mapped["Product"] = relationship()


class MovementTask(Base, AuditMixin):
    """Shelf-to-shelf transfer request: manager requests, staff completes.

    Same maker-checker shape as LayoutRequest, but for stock instead of layout.
    Completing a task is what writes the paired transfer_out/transfer_in
    StockMovements — this table is the request, not the ledger.
    """

    __tablename__ = "movement_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False, index=True)
    from_section_id: Mapped[int] = mapped_column(ForeignKey("zone_sections.id"), nullable=False)
    to_section_id: Mapped[int] = mapped_column(ForeignKey("zone_sections.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    requested_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True, index=True)
    reason: Mapped[str] = mapped_column(String, nullable=False, default="")
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending", index=True)  # pending|completed

    product: Mapped["Product"] = relationship()
