from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.items.models import Product


class Floor(Base):
    """A physical floor of a warehouse building.

    `level` is the ordinal the map sorts tabs by (1 = ground). It is unique per
    warehouse, so two floors can't claim the same storey, while `name` is free
    text ("Mezzanine", "Cold Level").

    The blueprint_* / scale_* columns store the imported backdrop image (as a
    data URL) and its placement + real-world scale, all nullable -- most
    floors never get a blueprint. They live on the floor row rather than a
    separate table because they're 1:1 with a floor and never queried on
    their own.
    """

    __tablename__ = "floors"
    __table_args__ = (UniqueConstraint("warehouse_id", "level", name="uq_floor_warehouse_level"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False, index=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)

    blueprint_data_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    blueprint_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    blueprint_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    blueprint_width: Mapped[float | None] = mapped_column(Float, nullable=True)
    blueprint_height: Mapped[float | None] = mapped_column(Float, nullable=True)
    scale_px_per_unit: Mapped[float | None] = mapped_column(Float, nullable=True)
    scale_unit: Mapped[str | None] = mapped_column(String, nullable=True)

    sections: Mapped[list["ZoneSection"]] = relationship(back_populates="floor")


class ZoneSection(Base):
    __tablename__ = "zone_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String, nullable=False)  # "shelf" | "zone"
    # Nullable so deleting a floor doesn't cascade into deleting the boxes on
    # it -- an unassigned section is recoverable, a deleted one is not.
    floor_id: Mapped[int | None] = mapped_column(ForeignKey("floors.id"), nullable=True, index=True)
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    width: Mapped[float] = mapped_column(Float, nullable=False)
    height: Mapped[float] = mapped_column(Float, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)  # shelves only; ignored for "zone"

    floor: Mapped["Floor | None"] = relationship(back_populates="sections")


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
