from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from sqlalchemy import delete as sql_delete, update as sql_update

from app.dependencies import CurrentUser, DBSession
from app.models.alert import Alert
from app.models.analysis import Analysis
from app.models.farm import Farm
from app.models.sensor_reading import SensorReading
from app.models.user import UserProfile
from app.schemas.farm import FarmCreate, FarmResponse, FarmUpdate

router = APIRouter()


@router.post("/", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(body: FarmCreate, current_user: CurrentUser, db: DBSession) -> Farm:
    # 1 finca por usuario
    count_result = await db.execute(
        select(func.count()).where(Farm.user_id == current_user.user_id)
    )
    farm_count = count_result.scalar() or 0
    if farm_count >= UserProfile.MAX_FARMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "FARM_LIMIT_REACHED",
                "message": "Cada cuenta puede registrar 1 finca. Edita tu finca existente para cambiar el cultivo.",
            },
        )

    farm_data = body.model_dump()
    # Si el usuario no especificó su email, usamos el del perfil como contacto por defecto
    if not farm_data.get("owner_email"):
        farm_data["owner_email"] = current_user.email
    if not farm_data.get("owner_name") and current_user.full_name:
        farm_data["owner_name"] = current_user.full_name

    farm = Farm(**farm_data, user_id=current_user.user_id)
    db.add(farm)
    await db.commit()
    await db.refresh(farm)
    return farm


@router.get("/", response_model=list[FarmResponse])
async def list_farms(current_user: CurrentUser, db: DBSession, active_only: bool = True) -> list[Farm]:
    """Retorna solo las fincas del usuario autenticado."""
    stmt = select(Farm).where(Farm.user_id == current_user.user_id)
    if active_only:
        stmt = stmt.where(Farm.is_active == True)  # noqa: E712
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(farm_id: uuid.UUID, current_user: CurrentUser, db: DBSession) -> Farm:
    farm = await db.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    if farm.user_id != current_user.user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta finca")
    return farm


@router.patch("/{farm_id}", response_model=FarmResponse)
async def update_farm(
    farm_id: uuid.UUID, body: FarmUpdate, current_user: CurrentUser, db: DBSession
) -> Farm:
    farm = await db.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    if farm.user_id != current_user.user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta finca")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(farm, field, value)
    await db.commit()
    await db.refresh(farm)
    return farm


@router.delete("/{farm_id}", status_code=204)
async def delete_farm(farm_id: uuid.UUID, current_user: CurrentUser, db: DBSession) -> None:
    farm = await db.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    if farm.user_id != current_user.user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta finca")
    # Preserve analyses — just unlink them from the farm
    await db.execute(sql_update(Analysis).where(Analysis.farm_id == farm_id).values(farm_id=None))
    # Remove alerts and sensor readings tied to this farm
    await db.execute(sql_delete(Alert).where(Alert.farm_id == farm_id))
    await db.execute(sql_delete(SensorReading).where(SensorReading.farm_id == farm_id))
    await db.delete(farm)
    await db.commit()


@router.get("/{farm_id}/kpis")
async def get_farm_kpis(farm_id: uuid.UUID, current_user: CurrentUser, db: DBSession) -> dict:
    farm = await db.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    if farm.user_id != current_user.user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta finca")
    from app.services.kpi_service import KPIService
    return await KPIService().get_farm_kpis(str(farm_id), db)
