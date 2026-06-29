from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AnalysisRequest(BaseModel):
    farm_id: uuid.UUID | None = None
    farm_name: str = Field(..., max_length=200)
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    crop_type: str = Field(..., description="maíz|yuca|plátano|café|arroz|algodón")
    alert_email: EmailStr | None = None


class RecommendationItem(BaseModel):
    priority: int
    category: str
    action: str
    time_window: str
    justification: str


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    farm_name: str
    crop_type: str
    alert_level: str
    main_alert: str | None
    water_stress_index: float | None
    irrigation_needed: bool
    next_irrigation_date: str | None
    avg_temperature_c: float | None
    total_rain_7d_mm: float | None
    avg_vpd_kpa: float | None
    et0_7d_mm: float | None
    recommendations: list | None
    summary_for_farmer: str | None
    model_used: str
    input_tokens: int | None
    output_tokens: int | None
    cost_usd: float | None
    created_at: datetime


class PromptEvalRequest(BaseModel):
    v1_path: str
    v2_path: str
    test_cases: list[dict]


class PromptEvalResult(BaseModel):
    prompt_path: str
    avg_quality: float
    avg_latency_ms: float
    total_cost_usd: float
    valid_json_pct: float
    has_required_fields_pct: float


class ComparisonResult(BaseModel):
    v1: PromptEvalResult
    v2: PromptEvalResult
    recommendation: str


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    analysis_id: uuid.UUID | None = None
    message: str = Field(..., max_length=2000)
    history: list[ChatMessage] = []
    image_base64: str | None = None
    image_mime: str = "image/jpeg"


class ChatResponse(BaseModel):
    response: str
    input_tokens: int = 0
    output_tokens: int = 0


class ChatHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    content: str
    created_at: datetime
