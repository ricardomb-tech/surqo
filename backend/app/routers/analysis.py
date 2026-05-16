from __future__ import annotations

import uuid
from datetime import datetime, timezone

import logfire
from fastapi import APIRouter, BackgroundTasks, HTTPException
from sqlalchemy import select

from app.config import settings
from app.dependencies import CurrentUser, DBSession, PaidUser
from app.models.analysis import Analysis
from app.models.sensor_reading import SensorReading
from app.schemas.analysis import AnalysisRequest, AnalysisResponse, ComparisonResult, PromptEvalRequest
from app.services.alert_service import AlertService
from app.services.cache_service import cache_service
from app.services.climate_service import ClimateService
from app.services.llm_service import LLMService, PromptEvaluator

router = APIRouter()
climate_svc = ClimateService()
llm_svc = LLMService()
alert_svc = AlertService()


@router.post("/analyze", response_model=AnalysisResponse, status_code=201)
async def analyze_farm(
    body: AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: PaidUser,   # 402 automático si plan free
    db: DBSession,
) -> Analysis:
    cache_key = f"analysis:{body.lat:.3f}:{body.lon:.3f}:{body.crop_type}"
    cached = await cache_service.get(cache_key)
    if cached and not body.farm_id:
        logfire.info("Cache hit para análisis", key=cache_key)
        # Retornar desde cache si no tiene farm_id específico
        return Analysis(**{
            k: v for k, v in cached.items()
            if k in Analysis.__table__.columns.keys()
        })

    with logfire.span("analysis.analyze_farm", farm=body.farm_name, crop=body.crop_type):
        # Fetch clima
        climate_data = await climate_svc.fetch_forecast(body.lat, body.lon)

        # Última lectura de sensor si hay farm_id
        sensor_dict: dict | None = None
        if body.farm_id:
            stmt = (
                select(SensorReading)
                .where(SensorReading.farm_id == body.farm_id)
                .order_by(SensorReading.created_at.desc())
                .limit(1)
            )
            result = await db.execute(stmt)
            latest = result.scalar_one_or_none()
            if latest:
                sensor_dict = {
                    "Humedad suelo": f"{latest.soil_moisture_pct}%" if latest.soil_moisture_pct else "N/A",
                    "Temperatura suelo": f"{latest.soil_temp_c}°C" if latest.soil_temp_c else "N/A",
                    "Temperatura aire": f"{latest.air_temp_c}°C" if latest.air_temp_c else "N/A",
                    "Humedad aire": f"{latest.air_humidity_pct}%" if latest.air_humidity_pct else "N/A",
                    "VPD": f"{latest.vpd_kpa} kPa" if latest.vpd_kpa else "N/A",
                    "Batería": f"{latest.battery_mv}mV" if latest.battery_mv else "N/A",
                }

        # LLM análisis
        result_data = await llm_svc.analyze_farm(
            climate_data=climate_data,
            crop_type=body.crop_type,
            farm_name=body.farm_name,
            sensor_data=sensor_dict,
        )

        # Guardar en DB
        analysis = Analysis(
            farm_id=body.farm_id,
            farm_name=body.farm_name,
            crop_type=body.crop_type,
            alert_level=result_data.alert_level,
            main_alert=result_data.main_alert,
            water_stress_index=result_data.water_stress_index,
            avg_temperature_c=result_data.avg_temperature_c,
            total_rain_7d_mm=result_data.total_rain_7d_mm,
            avg_vpd_kpa=result_data.avg_vpd_kpa,
            et0_7d_mm=result_data.et0_7d_mm,
            irrigation_needed=result_data.irrigation_needed,
            next_irrigation_date=result_data.next_irrigation_date,
            recommendations=result_data.recommendations,
            summary_for_farmer=result_data.summary_for_farmer,
            prompt_version=result_data.prompt_version,
            model_used=result_data.model_used,
            input_tokens=result_data.input_tokens,
            output_tokens=result_data.output_tokens,
            cost_usd=result_data.cost_usd,
        )
        db.add(analysis)
        await db.commit()
        await db.refresh(analysis)

        # Cache
        await cache_service.set(cache_key, {
            "id": str(analysis.id),
            "farm_name": analysis.farm_name,
            "alert_level": analysis.alert_level,
            "summary_for_farmer": analysis.summary_for_farmer,
        }, settings.CACHE_TTL_ANALYSIS)

        # Email si crítico
        if result_data.alert_level == "critical" and body.alert_email:
            background_tasks.add_task(
                alert_svc.send_email_alert,
                to_email=body.alert_email,
                farm_name=body.farm_name,
                alert_level=result_data.alert_level,
                summary=result_data.summary_for_farmer,
                recommendations=result_data.recommendations,
            )

        logfire.info(
            "Análisis completado",
            farm=body.farm_name,
            alert=result_data.alert_level,
            cost=result_data.cost_usd,
        )
        return analysis


@router.get("/history/{farm_id}", response_model=list[AnalysisResponse])
async def get_history(farm_id: uuid.UUID, current_user: CurrentUser, db: DBSession) -> list[Analysis]:
    stmt = (
        select(Analysis)
        .where(Analysis.farm_id == farm_id)
        .order_by(Analysis.created_at.desc())
        .limit(10)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: uuid.UUID, current_user: CurrentUser, db: DBSession) -> Analysis:
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")
    return analysis


@router.post("/evaluate-prompts", response_model=ComparisonResult)
async def evaluate_prompts(body: PromptEvalRequest) -> ComparisonResult:
    evaluator = PromptEvaluator(llm_svc)
    result = await evaluator.compare_versions(
        body.v1_path, body.v2_path, body.test_cases
    )
    return ComparisonResult(
        v1=result.v1.__dict__,
        v2=result.v2.__dict__,
        recommendation=result.recommendation,
    )
