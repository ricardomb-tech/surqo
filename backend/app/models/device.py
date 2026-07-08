from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Device(Base):
    """Nodo físico ESP32. Se auto-registra por su MAC y el usuario lo empareja
    con una finca mediante el claim_code (sin hardcodear FARM_ID en el firmware)."""

    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # MAC normalizada (12 hex, minúsculas, sin separadores) — identidad única del hardware
    device_mac: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    # Código corto que el cliente escribe en la app para emparejar (derivado de la MAC)
    claim_code: Mapped[str] = mapped_column(String(12), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # Finca a la que quedó vinculado (null = sin emparejar)
    farm_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("farms.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Usuario que reclamó el dispositivo (null = sin emparejar)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("user_profiles.user_id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    firmware_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    @staticmethod
    def normalize_mac(mac: str) -> str:
        """A4:CF:12:A3:F2:C1 -> a4cf12a3f2c1"""
        return "".join(c for c in mac.lower() if c in "0123456789abcdef")

    @staticmethod
    def code_from_mac(normalized_mac: str) -> str:
        """Últimos 6 hex de la MAC en mayúsculas — el código impreso en el nodo."""
        return normalized_mac[-6:].upper()
