from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies import DBSession
from app.models.farm import Farm
from app.schemas.farm import FarmCreate, FarmResponse, FarmUpdate

router = APIRouter()


@router.post("/", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(body: FarmCreate, db: DBSession) -> Farm:
    farm = Farm(**body.model_dump())
    db.add(farm)
    await db.commit()
    await db.refresh(farm)
    return farm


@router.get("/", response_model=list[FarmResponse])
async def list_farms(db: DBSession, active_only: bool = True) -> list[Farm]:
    stmt = select(Farm)
    if active_only:
        stmt = stmt.where(Farm.is_active == True)  # noqa: E712
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(farm_id: uuid.UUID, db: DBSession) -> Farm:
    farm = await db.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    return farm


@router.patch("/{farm_id}", response_model=FarmResponse)
async def update_farm(farm_id: uuid.UUID, body: FarmUpdate, db: DBSession) -> Farm:
    farm = await db.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(farm, field, value)
    await db.commit()
    await db.refresh(farm)
    return farm


@router.get("/{farm_id}/kpis")
async def get_farm_kpis(farm_id: uuid.UUID, db: DBSession) -> dict:
    from app.services.kpi_service import KPIService
    return await KPIService().get_farm_kpis(str(farm_id), db)
