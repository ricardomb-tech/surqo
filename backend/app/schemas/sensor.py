from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SensorReadingCreate(BaseModel):
    device_id: str = Field(..., max_length=100)
    farm_id: uuid.UUID | None = None
    soil_moisture_pct: float | None = Field(None, ge=0, le=100)
    soil_temp_c: float | None = Field(None, ge=-10, le=80)
    air_temp_c: float | None = Field(None, ge=-10, le=60)
    air_humidity_pct: float | None = Field(None, ge=0, le=100)
    uv_index: float | None = Field(None, ge=0, le=20)
    battery_mv: int | None = None
    rssi_dbm: int | None = None
    raw_payload: dict | None = None
    source: str = "http"
    firmware_version: str | None = None


class SensorReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    device_id: str
    farm_id: uuid.UUID | None
    soil_moisture_pct: float | None
    soil_temp_c: float | None
    air_temp_c: float | None
    air_humidity_pct: float | None
    uv_index: float | None
    battery_mv: int | None
    rssi_dbm: int | None
    vpd_kpa: float | None
    source: str
    firmware_version: str | None
    created_at: datetime


class TimeseriesPoint(BaseModel):
    timestamp: datetime
    value: float | None


class SensorStats(BaseModel):
    metric: str
    min_val: float | None
    max_val: float | None
    avg_val: float | None
    trend: str  # up | down | stable
    unit: str
