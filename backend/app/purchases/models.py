from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import AuditMixin
from app.db.session import Base


class PurchaseOrder(Base, AuditMixin):
    """Inbound purchase order header.

    Receiving is two phases, which is why placements are a separate table:
      pending   -> receiving : staff check each line off as counted (ReceivingChecklistModal)
      receiving -> completed : staff allocate each line across shelves (PlaceInInventoryChecklist)
    """

    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    po_no: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)  # "PO-2001"
    supplier_id: Mapped[int | None] = mapped_column(ForeignKey("suppliers.id"), nullable=True, index=True)
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(
        String, nullable=False, default="pending", index=True
    )  # pending|receiving|completed|cancelled
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    placed_at: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    items: Mapped[list["PurchaseOrderItem"]] = relationship(
        back_populates="purchase", cascade="all, delete-orphan"
    )


class PurchaseOrderItem(Base, AuditMixin):
    __tablename__ = "purchase_order_items"
    __table_args__ = (CheckConstraint("quantity > 0", name="ck_po_items_qty_positive"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    purchase_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    purchase: Mapped["PurchaseOrder"] = relationship(back_populates="items")
    placements: Mapped[list["PurchasePlacement"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )


class PurchasePlacement(Base, AuditMixin):
    """Which shelf a received line was placed on, and how much. One line can be
    split across several shelves — the frontend's `PurchaseItem.placedIn[]`.

    Shelf capacity is enforced in app code, not here: the check is
    SUM(stock on shelf) + placed <= zone_sections.capacity, which spans rows.
    """

    __tablename__ = "purchase_placements"
    __table_args__ = (CheckConstraint("quantity > 0", name="ck_po_placements_qty_positive"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("purchase_order_items.id"), nullable=False, index=True)
    section_id: Mapped[int] = mapped_column(ForeignKey("zone_sections.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    item: Mapped["PurchaseOrderItem"] = relationship(back_populates="placements")
