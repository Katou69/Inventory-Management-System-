from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


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
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)


class ZoneStockEntry(Base):
    __tablename__ = "zone_stock_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    section_id: Mapped[int] = mapped_column(ForeignKey("zone_sections.id"), nullable=False, index=True)
    item_name: Mapped[str] = mapped_column(String, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)


class LayoutRequest(Base):
    __tablename__ = "layout_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id"), nullable=False, index=True)
    requested_by: Mapped[str] = mapped_column(String, nullable=False)
    request_note: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")  # pending|approved|rejected
    reviewed_by: Mapped[str | None] = mapped_column(String, nullable=True)
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
    # ponytail: section_id not FK-enforced (create items have no section yet); tighten if orphaned refs become a problem
    section_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    proposed_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    previous_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    request: Mapped["LayoutRequest"] = relationship(back_populates="items")
