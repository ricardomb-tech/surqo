from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FarmSummary(BaseModel):
    id: uuid.UUID
    name: str
    crop_type: str
    area_hectares: float | None = None
    municipality: str | None = None
    department: str | None = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

    user_id: uuid.UUID
    email: str
    full_name: str | None
    phone: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    cover_url: str | None = None
    plan: str
    is_paid: bool
    can_use_ai_analysis: bool
    can_send_email_alert: bool
    email_alerts_this_month: int
    farms_count: int = 0
    analyses_used: int = 0
    analyses_limit: int | None = None
    analyses_remaining: int | None = None
    tokens_used: int = 0
    tokens_limit: int | None = None
    tokens_remaining: int | None = None
    can_use_chat: bool = True
    farms: list[FarmSummary] = []
    created_at: datetime


class UserPlanUpdate(BaseModel):
    plan: str  # "free" | "paid"


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(None, max_length=200)
    phone: str | None = Field(None, max_length=30)
    bio: str | None = Field(None, max_length=500)
    avatar_url: str | None = Field(None, max_length=500)
    cover_url: str | None = Field(None, max_length=500)
