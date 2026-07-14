from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.items.models import Product


class ZoneSection(Base):
    __tablename__ = "zone_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String, nullable=False)  # "shelf" | "zone"
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    width: Mapped[float] = mapped_column(Float, nullable=False)
    height: Mapped[float] = mapped_column(Float, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)  # shelves only; ignored for "zone"


class ZoneStockEntry(Base):
    """Per-shelf, per-product stock.

    ponytail: this is a read cache over stock_movements
    (SUM(quantity) WHERE section_id = X) — the ledger is the truth. Kept because
    the picking/placing modals read it on every keystroke. Drop it if the
    aggregate turns out to be fast enough.
    """

    __tablename__ = "zone_stock_entries"
    __table_args__ = (UniqueConstraint("section_id", "product_id", name="uq_zone_stock_section_product"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    section_id: Mapped[int] = mapped_column(ForeignKey("zone_sections.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    product: Mapped["Product"] = relationship(lazy="joined")

    @property
    def item_name(self) -> str:
        """The API emits `itemName`; the column is now a product FK."""
        return self.product.name if self.product else ""


class LayoutRequest(Base):
    __tablename__ = "layout_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False, index=True)
    requested_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True, index=True)
    request_note: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")  # pending|approved|rejected
    reviewed_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_note: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    items: Mapped[list["LayoutRequestItem"]] = relationship(
        back_populates="request", cascade="all, delete-orphan"
    )


class LayoutRequestItem(Base):
    __tablename__ = "layout_request_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("layout_requests.id"), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(String, nullable=False)  # create|update|delete
    # Nullable + no FK: a "create" item has no section yet, and a "delete" item's
    # section is gone once applied — an FK would reject both.
    section_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    proposed_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    previous_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    request: Mapped["LayoutRequest"] = relationship(back_populates="items")
