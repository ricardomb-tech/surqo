from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, Numeric, SmallInteger, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    device_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    farm_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farms.id"), nullable=True
    )
    soil_moisture_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    soil_temp_c: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    air_temp_c: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    air_humidity_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    uv_index: Mapped[float | None] = mapped_column(Numeric(4, 1), nullable=True)
    battery_mv: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rssi_dbm: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    vpd_kpa: Mapped[float | None] = mapped_column(Numeric(5, 3), nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="mqtt")
    firmware_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    farm: Mapped[Farm | None] = relationship("Farm", back_populates="sensor_readings")

    __table_args__ = (
        Index("ix_sensor_device_time", "device_id", "created_at"),
        Index("ix_sensor_farm_time", "farm_id", "created_at"),
    )


from app.models.farm import Farm  # noqa: E402
