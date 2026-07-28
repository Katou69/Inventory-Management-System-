from pydantic import BaseModel


class PickedShelfOut(BaseModel):
    shelf: str
    quantity: int


class OrderItemOut(BaseModel):
    product: str
    quantity: int
    pickedFrom: list[PickedShelfOut] = []


class OrderOut(BaseModel):
    id: str  # order_no
    customer: str
    items: list[OrderItemOut]
    total: float
    status: str
    date: str
