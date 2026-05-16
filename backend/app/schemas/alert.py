from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    farm_id: uuid.UUID | None
    device_id: str | None
    alert_type: str
    severity: str
    title: str
    description: str
    recommended_action: str | None
    response_time: str | None
    is_resolved: bool
    resolved_at: datetime | None
    email_sent: bool
    email_sent_at: datetime | None
    created_at: datetime


class AlertResolveRequest(BaseModel):
    resolved: bool = True


class AlertNotifyRequest(BaseModel):
    to_email: str
    farm_name: str = "Finca"
