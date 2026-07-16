# Save as: backend/app/items/schemas.py
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

StockStatus = Literal["in_stock", "low_stock", "out_of_stock"]


class ProductInventoryOut(BaseModel):
    """One row of the inventory table, scoped to a single warehouse."""

    id: int
    name: str
    sku: str
    price: float
    category: str
    supplier: str
    supplierId: Optional[int] = None
    stock: int
    minStock: int
    status: StockStatus


class InventoryStatsOut(BaseModel):
    totalItems: int
    lowStock: int
    outOfStock: int


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    minStock: Optional[int] = None


class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    price: float
    minStock: int


class StockMovementOut(BaseModel):
    """One line of the View History modal. `note` carries the full sentence
    (e.g. "50 units moved from A1 to A2") so the frontend doesn't need to
    reconstruct it from two separate ledger rows."""

    id: int
    kind: str  # inbound | outbound | transfer_in | transfer_out | adjustment
    quantity: int
    occurredAt: datetime
    note: str


class MovementTaskCreateRequest(BaseModel):
    productId: int
    quantity: int
    fromShelfId: int
    toShelfId: int
    reason: str = ""


class MovementTaskOut(BaseModel):
    id: int
    productId: int
    productName: str
    quantity: int
    fromShelf: str
    toShelf: str
    requestedBy: str
    reason: str
    status: str
