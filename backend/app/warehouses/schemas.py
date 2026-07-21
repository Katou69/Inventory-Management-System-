# Save as: backend/app/warehouses/schemas.py
from pydantic import BaseModel, ConfigDict


class WarehouseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    location: str
    status: str
