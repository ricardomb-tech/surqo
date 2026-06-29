from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserProfile(Base):
    """Perfil de usuario sincronizado con Supabase Auth.

    El user_id es el UUID que Supabase genera al registrar el usuario.
    Lo usamos como PK para que coincida directamente con el sub del JWT.
    """

    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Plan: "free" | "paid"
    plan: Mapped[str] = mapped_column(String(20), default="free", nullable=False)
    plan_activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Contadores mensuales (reseteados cada mes)
    email_alerts_this_month: Mapped[int] = mapped_column(Integer, default=0)
    alerts_reset_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Cuota de análisis IA (lifetime para free, ilimitado para paid)
    analyses_used: Mapped[int] = mapped_column(Integer, default=0)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)

    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    farms: Mapped[list[Farm]] = relationship("Farm", back_populates="owner", lazy="noload")

    FREE_ANALYSES_LIMIT = 4
    FREE_TOKENS_LIMIT = 3_200   # 4 × 800 tokens output
    FREE_OUTPUT_TOKENS_PER_ANALYSIS = 800
    PAID_OUTPUT_TOKENS_PER_ANALYSIS = 2_048
    MAX_FARMS = 1

    @property
    def is_paid(self) -> bool:
        return self.plan == "paid"

    @property
    def can_use_ai_analysis(self) -> bool:
        if self.is_admin or self.is_paid:
            return True
        return self.analyses_used < self.FREE_ANALYSES_LIMIT

    @property
    def can_use_chat(self) -> bool:
        """Permite chatear mientras no se hayan agotado los tokens del plan free."""
        if self.is_admin or self.is_paid:
            return True
        return self.tokens_used < self.FREE_TOKENS_LIMIT

    @property
    def tokens_remaining(self) -> int | None:
        """None = ilimitado (plan paid). Entero = tokens restantes en free."""
        if self.is_paid or self.is_admin:
            return None
        return max(0, self.FREE_TOKENS_LIMIT - self.tokens_used)

    @property
    def analyses_remaining(self) -> int | None:
        """None = ilimitado (plan paid). Entero = restantes en free."""
        if self.is_paid or self.is_admin:
            return None
        return max(0, self.FREE_ANALYSES_LIMIT - self.analyses_used)

    @property
    def max_output_tokens(self) -> int:
        """Tokens máximos de output por análisis según plan."""
        return self.PAID_OUTPUT_TOKENS_PER_ANALYSIS if self.is_paid else self.FREE_OUTPUT_TOKENS_PER_ANALYSIS

    @property
    def can_send_email_alert(self) -> bool:
        return True


from app.models.farm import Farm  # noqa: E402
