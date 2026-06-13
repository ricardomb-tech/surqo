from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FarmCreate(BaseModel):
    name: str = Field(..., max_length=200)
    owner_name: str | None = None
    owner_email: str | None = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    crop_type: str = Field(..., description="maíz|yuca|plátano|café|arroz|algodón")
    area_hectares: float | None = Field(None, gt=0)
    altitude_masl: int | None = None
    department: str = "Córdoba"
    municipality: str | None = None


class FarmUpdate(BaseModel):
    name: str | None = None
    owner_name: str | None = None
    owner_email: str | None = None
    crop_type: str | None = None
    area_hectares: float | None = None
    altitude_masl: int | None = None
    department: str | None = None
    municipality: str | None = None
    is_active: bool | None = None


class FarmResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    owner_name: str | None
    owner_email: str | None
    latitude: float
    longitude: float
    crop_type: str
    area_hectares: float | None
    altitude_masl: int | None
    department: str
    municipality: str | None
    is_active: bool
    created_at: datetime
