from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

SectionKind = Literal["shelf", "zone"]
ZoneChangeAction = Literal["create", "update", "delete"]
ZoneChangeStatus = Literal["pending", "approved", "rejected"]


class ZoneSectionOut(BaseModel):
    id: int
    warehouseId: int = Field(validation_alias="warehouse_id")
    kind: SectionKind
    code: str
    name: str
    x: float
    y: float
    width: float
    height: float
    capacity: int

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ZoneStockEntryOut(BaseModel):
    id: int
    sectionId: int = Field(validation_alias="section_id")
    itemName: str = Field(validation_alias="item_name")
    quantity: int

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ZoneFields(BaseModel):
    kind: Optional[SectionKind] = None
    code: Optional[str] = None
    name: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    capacity: Optional[int] = None


class ZoneChangeItemIn(BaseModel):
    actionType: ZoneChangeAction = Field(validation_alias="action_type")
    sectionId: Optional[int] = Field(default=None, validation_alias="section_id")
    proposedData: Optional[ZoneFields] = Field(default=None, validation_alias="proposed_data")
    previousData: Optional[ZoneFields] = Field(default=None, validation_alias="previous_data")

    model_config = ConfigDict(populate_by_name=True)


class ZoneChangeItemOut(ZoneChangeItemIn):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class DirectChangeRequest(BaseModel):
    item: ZoneChangeItemIn
    requestedBy: str = Field(validation_alias="requested_by")

    model_config = ConfigDict(populate_by_name=True)


class ProposeChangeRequest(BaseModel):
    items: list[ZoneChangeItemIn]
    requestNote: Optional[str] = Field(default=None, validation_alias="request_note")
    requestedBy: str = Field(validation_alias="requested_by")

    model_config = ConfigDict(populate_by_name=True)


class ApproveRequest(BaseModel):
    reviewedBy: str = Field(validation_alias="reviewed_by")

    model_config = ConfigDict(populate_by_name=True)


class RejectRequest(BaseModel):
    reviewedBy: str = Field(validation_alias="reviewed_by")
    reviewNote: str = Field(validation_alias="review_note")

    model_config = ConfigDict(populate_by_name=True)


class ZoneChangeRequestOut(BaseModel):
    id: int
    warehouseId: int = Field(validation_alias="warehouse_id")
    requestedBy: str = Field(validation_alias="requested_by")
    items: list[ZoneChangeItemOut]
    requestNote: Optional[str] = Field(default=None, validation_alias="request_note")
    status: ZoneChangeStatus
    reviewedBy: Optional[str] = Field(default=None, validation_alias="reviewed_by")
    reviewedAt: Optional[datetime] = Field(default=None, validation_alias="reviewed_at")
    reviewNote: Optional[str] = Field(default=None, validation_alias="review_note")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
