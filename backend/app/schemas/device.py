from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DeviceRegister(BaseModel):
    """El nodo se auto-registra al arrancar (endpoint público)."""
    device_mac: str = Field(..., max_length=32)
    firmware_version: str | None = Field(None, max_length=20)


class DeviceRegisterResponse(BaseModel):
    claim_code: str
    is_claimed: bool
    # Solo viene poblado UNA VEZ: la primera vez que el nodo llama /register
    # dentro de los 5 min posteriores a que su dueño lo emparejó (POST /claim).
    # El firmware debe guardarlo en NVS — no se vuelve a entregar después.
    device_secret: str | None = None


class DeviceClaim(BaseModel):
    """El usuario empareja un nodo con su finca escribiendo el código."""
    claim_code: str = Field(..., min_length=4, max_length=12)
    farm_id: uuid.UUID
    name: str | None = Field(None, max_length=200)


class DeviceRename(BaseModel):
    name: str = Field(..., max_length=200)


class DeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    device_mac: str
    claim_code: str
    name: str | None
    farm_id: uuid.UUID | None
    firmware_version: str | None
    last_seen: datetime | None
    created_at: datetime
