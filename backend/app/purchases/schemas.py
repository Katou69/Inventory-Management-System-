from pydantic import BaseModel


class PlacedShelfOut(BaseModel):
    shelf: str
    quantity: int


class PurchaseItemOut(BaseModel):
    product: str
    quantity: int
    placedIn: list[PlacedShelfOut] = []


class PurchaseOrderOut(BaseModel):
    id: str  # po_no
    supplier: str
    items: list[PurchaseItemOut]
    total: float
    status: str
    date: str
