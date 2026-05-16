from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farms.id"), nullable=True, index=True
    )
    farm_name: Mapped[str] = mapped_column(String(200))
    crop_type: Mapped[str] = mapped_column(String(100))
    alert_level: Mapped[str] = mapped_column(String(20))
    water_stress_index: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    avg_temperature_c: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    total_rain_7d_mm: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    avg_vpd_kpa: Mapped[float | None] = mapped_column(Numeric(5, 3), nullable=True)
    et0_7d_mm: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    irrigation_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    next_irrigation_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    recommendations: Mapped[list | None] = mapped_column(JSON, nullable=True)
    main_alert: Mapped[str | None] = mapped_column(String(500), nullable=True)
    summary_for_farmer: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_version: Mapped[str] = mapped_column(String(20), default="1.0.0")
    model_used: Mapped[str] = mapped_column(String(50))
    input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_usd: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    farm: Mapped[Farm | None] = relationship("Farm", back_populates="analyses")


from app.models.farm import Farm  # noqa: E402
