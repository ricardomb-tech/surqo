from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # FK al perfil del usuario dueño de la finca
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profiles.user_id"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    owner_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    owner_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    latitude: Mapped[float] = mapped_column(Numeric(10, 8), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(11, 8), nullable=False)
    crop_type: Mapped[str] = mapped_column(String(100), nullable=False)
    area_hectares: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    altitude_masl: Mapped[int | None] = mapped_column(Integer, nullable=True)
    department: Mapped[str] = mapped_column(String(100), default="Córdoba")
    municipality: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    sensor_readings: Mapped[list[SensorReading]] = relationship(
        "SensorReading", back_populates="farm", lazy="noload"
    )
    analyses: Mapped[list[Analysis]] = relationship(
        "Analysis", back_populates="farm", lazy="noload"
    )
    alerts: Mapped[list[Alert]] = relationship(
        "Alert", back_populates="farm", lazy="noload"
    )
    owner: Mapped[UserProfile | None] = relationship(
        "UserProfile", back_populates="farms", lazy="noload"
    )


# Avoid circular imports
from app.models.sensor_reading import SensorReading  # noqa: E402
from app.models.analysis import Analysis  # noqa: E402
from app.models.alert import Alert  # noqa: E402
from app.models.user import UserProfile  # noqa: E402
