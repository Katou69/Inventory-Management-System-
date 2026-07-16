from typing import Literal

from pydantic import BaseModel, ConfigDict

StatusCardIcon = Literal["stocks", "value", "suppliers", "revenue", "lowStock", "orders"]
ChangeDirection = Literal["up", "down"]
MovementType = Literal["Inbound", "Outbound", "Transfer In", "Transfer Out"]
ProductStockStatus = Literal["Normal", "Low", "Critical"]
WarehouseStatus = Literal["Active", "Under Maintenance", "Closed"]
NotificationType = Literal["stock", "order", "alert", "user"]
StatColor = Literal["blue", "green", "amber", "red"]


class StatusCardOut(BaseModel):
    id: str
    label: str
    value: str  # pre-formatted, e.g. "$41,111"
    changeText: str
    changeDirection: ChangeDirection
    icon: StatusCardIcon


class InventoryDataPointOut(BaseModel):
    label: str
    stockIn: int
    stockOut: int
    stockValue: float

class ActivityEntryOut(BaseModel):
    id : int
    name : str
    role : str
    avatar: str
    description:str
    date:str
    time: str
    
class ProductOut(BaseModel):
    id: int
    name: str
    image: str
    category: str
    quantity: str  # "120 units"
    revenue: str  # "$13,945"


class StockMovementOut(BaseModel):
    id: int
    item: str
    type: MovementType
    qty: int  # signed
    date: str


class DailyMovementOut(BaseModel):
    day: str
    inbound: int
    outbound: int


class WarehouseProductOut(BaseModel):
    id: int
    sku: str
    name: str
    category: str
    quantity: int
    status: ProductStockStatus
    lastUpdated: str

class SalesOverview(BaseModel):
    numberOfSales : int
    totalSales : float
    target : int

class SalesGoalIn(BaseModel):
    target : int

class WarehouseOut(BaseModel):
    id: int
    name: str
    image: str
    lastInspection: str
    warehouseId: str  # "WH-001"
    location: str
    manager: str
    capacityUsed: int
    capacityTotal: int

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class WarehouseDetailOut(WarehouseOut):
    status: WarehouseStatus
    phone: str
    email: str
    address: str
    nextInspection: str
    totalSkus: int
    lowStockCount: int
    pendingInbound: int
    throughput: int
    dailyMovement: list[DailyMovementOut]
    movements: list[StockMovementOut]
    products: list[WarehouseProductOut]
    activities: list[ActivityEntryOut]


class CreateWarehouseIn(BaseModel):
    name: str
    location: str
    manager: str = ""
    status: WarehouseStatus = "Active"
    image: str | None = None


class UpdateWarehouseProfileIn(BaseModel):
    manager: str
    address: str
    phone: str
    email: str
    nextInspection: str  # "DD-MM-YYYY"
    image: str | None = None


class NotificationOut(BaseModel):
    id: int
    type: NotificationType
    title: str
    description: str
    time: str  # relative, e.g. "10 min ago"
    unread: bool


class SearchIndexOut(BaseModel):
    products: list[ProductOut]
    warehouses: list[WarehouseOut]


class StaffStatOut(BaseModel):
    id: int
    title: str
    value: int
    description: str
    color: StatColor
