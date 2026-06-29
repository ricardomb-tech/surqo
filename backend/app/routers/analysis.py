from __future__ import annotations

import pathlib
import uuid

import logfire
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select

from app.config import settings
from app.dependencies import CurrentUser, DBSession
from app.models.analysis import Analysis
from app.models.chat_message import AnalysisChatMessage
from app.models.farm import Farm
from app.models.sensor_reading import SensorReading
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    ChatHistoryItem,
    ChatRequest,
    ChatResponse,
    ChatSession,
    ComparisonResult,
    PromptEvalRequest,
)
from app.services.alert_service import AlertService
from app.services.cache_service import cache_service
from app.services.climate_service import ClimateService
from app.services.llm_service import LLMService, PromptEvaluator

router = APIRouter()
climate_svc = ClimateService()
llm_svc = LLMService()
alert_svc = AlertService()
limiter = Limiter(key_func=get_remote_address)

# Directorio base de prompts — usado para validar path traversal
_PROMPTS_DIR = (pathlib.Path(__file__).parent.parent / "services" / "prompts").resolve()


@router.post("/analyze", response_model=AnalysisResponse, status_code=201)
@limiter.limit("10/minute")
async def analyze_farm(
    request: Request,
    body: AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: DBSession,
) -> Analysis:
    # Verificar cuota de análisis IA
    if not current_user.can_use_ai_analysis:
        raise HTTPException(
            status_code=402,
            detail={
                "code": "analysis_quota_exceeded",
                "message": (
                    f"Usaste tus {current_user.FREE_ANALYSES_LIMIT} análisis IA gratuitos. "
                    "Contacta a nuestro equipo para activar el plan premium y tener análisis ilimitados."
                ),
                "analyses_used": current_user.analyses_used,
                "analyses_limit": current_user.FREE_ANALYSES_LIMIT,
                "contact_url": "https://surqo.co/upgrade",
            },
        )

    cache_key = f"analysis:{body.lat:.3f}:{body.lon:.3f}:{body.crop_type}"
    cached = await cache_service.get(cache_key)
    if cached and not body.farm_id:
        logfire.info("Cache hit para análisis", key=cache_key)
        return Analysis(**{
            k: v for k, v in cached.items()
            if k in Analysis.__table__.columns.keys()
        })

    with logfire.span("analysis.analyze_farm", farm=body.farm_name, crop=body.crop_type):
        climate_data = await climate_svc.fetch_forecast(body.lat, body.lon)

        sensor_dict: dict | None = None
        if body.farm_id:
            # Verificar que la finca pertenece al usuario
            farm = await db.get(Farm, body.farm_id)
            if not farm or farm.user_id != current_user.user_id:
                raise HTTPException(status_code=403, detail="Sin acceso a esta finca")

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

        result_data = await llm_svc.analyze_farm(
            climate_data=climate_data,
            crop_type=body.crop_type,
            farm_name=body.farm_name,
            sensor_data=sensor_dict,
            max_output_tokens=current_user.max_output_tokens,
        )

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

        # Actualizar contadores de cuota en el perfil del usuario
        current_user.analyses_used += 1
        current_user.tokens_used += result_data.output_tokens
        db.add(current_user)

        await db.commit()
        await db.refresh(analysis)

        await cache_service.set(cache_key, {
            "id": str(analysis.id),
            "farm_name": analysis.farm_name,
            "alert_level": analysis.alert_level,
            "summary_for_farmer": analysis.summary_for_farmer,
        }, settings.CACHE_TTL_ANALYSIS)

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
    farm = await db.get(Farm, farm_id)
    if not farm or farm.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Sin acceso a esta finca")

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
    # Verificar que el análisis pertenece a una finca del usuario
    if analysis.farm_id:
        farm = await db.get(Farm, analysis.farm_id)
        if not farm or farm.user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Sin acceso a este análisis")
    return analysis


async def _verify_analysis_access(analysis_id: uuid.UUID, current_user: CurrentUser, db: DBSession) -> Analysis:
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")
    if analysis.farm_id:
        farm = await db.get(Farm, analysis.farm_id)
        if not farm or farm.user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Sin acceso")
    return analysis


@router.get("/{analysis_id}/chat-sessions", response_model=list[ChatSession])
async def get_chat_sessions(analysis_id: uuid.UUID, current_user: CurrentUser, db: DBSession) -> list[dict]:
    """Lista todas las conversaciones (sesiones) de un análisis."""
    await _verify_analysis_access(analysis_id, current_user, db)

    stmt = (
        select(AnalysisChatMessage)
        .where(
            AnalysisChatMessage.analysis_id == analysis_id,
            AnalysisChatMessage.role == "user",
        )
        .order_by(AnalysisChatMessage.created_at.asc())
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    # Agrupar por session_id
    sessions: dict[uuid.UUID, dict] = {}
    for row in rows:
        sid = row.session_id
        if sid not in sessions:
            sessions[sid] = {
                "session_id": sid,
                "started_at": row.created_at,
                "message_count": 0,
                "first_message": row.content[:80],
            }
        sessions[sid]["message_count"] += 1

    return list(sessions.values())


@router.get("/{analysis_id}/chat-history", response_model=list[ChatHistoryItem])
async def get_chat_history(
    analysis_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
    session_id: uuid.UUID | None = None,
) -> list[AnalysisChatMessage]:
    await _verify_analysis_access(analysis_id, current_user, db)

    filters = [AnalysisChatMessage.analysis_id == analysis_id]
    if session_id:
        filters.append(AnalysisChatMessage.session_id == session_id)

    stmt = (
        select(AnalysisChatMessage)
        .where(*filters)
        .order_by(AnalysisChatMessage.created_at.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat_with_analysis(
    request: Request,
    body: ChatRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> ChatResponse:
    context: dict | None = None
    if body.analysis_id:
        analysis = await db.get(Analysis, body.analysis_id)
        if analysis:
            if analysis.farm_id:
                farm = await db.get(Farm, analysis.farm_id)
                if farm and farm.user_id != current_user.user_id:
                    raise HTTPException(status_code=403, detail="Sin acceso a este análisis")
            context = {
                "finca": analysis.farm_name,
                "cultivo": analysis.crop_type,
                "nivel_alerta": analysis.alert_level,
                "alerta_principal": analysis.main_alert,
                "resumen": analysis.summary_for_farmer,
                "estres_hidrico": float(analysis.water_stress_index) if analysis.water_stress_index else None,
                "riego_necesario": analysis.irrigation_needed,
                "proxima_irrigacion": analysis.next_irrigation_date,
                "temperatura_promedio_c": float(analysis.avg_temperature_c) if analysis.avg_temperature_c else None,
                "lluvia_7d_mm": float(analysis.total_rain_7d_mm) if analysis.total_rain_7d_mm else None,
                "vpd_kpa": float(analysis.avg_vpd_kpa) if analysis.avg_vpd_kpa else None,
                "et0_7d_mm": float(analysis.et0_7d_mm) if analysis.et0_7d_mm else None,
                "recomendaciones": analysis.recommendations or [],
            }

    history = [{"role": m.role, "content": m.content} for m in body.history]
    response_text, inp, out = await llm_svc.chat_with_analysis(
        message=body.message,
        history=history,
        analysis_context=context,
        image_base64=body.image_base64,
        image_mime=body.image_mime,
    )

    # Persistir el intercambio si hay analysis_id
    session_id = body.session_id or uuid.uuid4()
    if body.analysis_id:
        db.add(AnalysisChatMessage(
            analysis_id=body.analysis_id,
            session_id=session_id,
            role="user",
            content=body.message,
            image_mime=body.image_mime if body.image_base64 else None,
        ))
        db.add(AnalysisChatMessage(
            analysis_id=body.analysis_id,
            session_id=session_id,
            role="assistant",
            content=response_text,
        ))
        await db.commit()

    return ChatResponse(response=response_text, session_id=session_id, input_tokens=inp, output_tokens=out)


@router.post("/evaluate-prompts", response_model=ComparisonResult)
async def evaluate_prompts(
    body: PromptEvalRequest,
    current_user: CurrentUser,
) -> ComparisonResult:
    # Solo administradores pueden evaluar prompts
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden usar esta función")

    # Prevenir path traversal: los paths deben resolverse dentro del directorio de prompts
    for path_str in (body.v1_path, body.v2_path):
        resolved = (_PROMPTS_DIR / path_str).resolve()
        if not resolved.is_relative_to(_PROMPTS_DIR):
            raise HTTPException(status_code=400, detail=f"Ruta inválida: {path_str}")

    evaluator = PromptEvaluator(llm_svc)
    result = await evaluator.compare_versions(
        body.v1_path, body.v2_path, body.test_cases
    )
    return ComparisonResult(
        v1=result.v1.__dict__,
        v2=result.v2.__dict__,
        recommendation=result.recommendation,
    )
