from datetime import date
from typing import Literal, Union

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Role = Literal["admin", "manager", "staff"]
Status = Literal["active", "inactive"]
WarehouseId = Union[int, Literal["all"]]


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role
    warehouseId: WarehouseId = Field(validation_alias="warehouse_id")
    status: Status
    joinedDate: date = Field(validation_alias="joined_date")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @field_validator("warehouseId", mode="before")
    @classmethod
    def _coerce_warehouse_id(cls, v: object) -> WarehouseId:
        if isinstance(v, str) and v != "all":
            return int(v)
        return v  # type: ignore[return-value]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
