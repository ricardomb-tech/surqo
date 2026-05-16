from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserProfile(Base):
    """Perfil de usuario sincronizado con Supabase Auth.

    El user_id es el UUID que Supabase genera al registrar el usuario.
    Lo usamos como PK para que coincida directamente con el sub del JWT.
    """

    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Plan: "free" | "paid"
    plan: Mapped[str] = mapped_column(String(20), default="free", nullable=False)
    plan_activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Contadores mensuales (reseteados cada mes)
    email_alerts_this_month: Mapped[int] = mapped_column(Integer, default=0)
    alerts_reset_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    farms: Mapped[list[Farm]] = relationship("Farm", back_populates="owner", lazy="noload")

    # ── Constantes del plan ───────────────────────────────────────────────────
    FREE_MAX_FARMS = 3
    FREE_MAX_EMAIL_ALERTS_MONTH = 10

    @property
    def is_paid(self) -> bool:
        return self.plan == "paid"

    @property
    def can_create_farm(self) -> bool:
        if self.is_paid:
            return True
        # Verificado dinámicamente en el router con COUNT de fincas
        return True

    @property
    def can_use_ai_analysis(self) -> bool:
        return self.is_paid

    @property
    def can_send_email_alert(self) -> bool:
        if self.is_paid:
            return True
        return self.email_alerts_this_month < self.FREE_MAX_EMAIL_ALERTS_MONTH


from app.models.farm import Farm  # noqa: E402
