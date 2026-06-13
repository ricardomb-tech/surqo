from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    email: str
    full_name: str | None
    plan: str
    is_paid: bool
    can_use_ai_analysis: bool
    can_send_email_alert: bool
    email_alerts_this_month: int
    farms_count: int = 0
    created_at: datetime


class UserPlanUpdate(BaseModel):
    plan: str  # "free" | "paid"


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
