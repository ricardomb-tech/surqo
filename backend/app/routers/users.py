from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from app.dependencies import CurrentUser, DBSession
from app.models.farm import Farm
from app.models.user import UserProfile
from app.schemas.user import UserProfileResponse, UserProfileUpdate, UserPlanUpdate

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: CurrentUser, db: DBSession) -> dict:
    """Retorna el perfil del usuario autenticado con stats actualizados."""
    farm_count_result = await db.execute(
        select(func.count()).where(Farm.user_id == current_user.user_id)
    )
    farms_count = farm_count_result.scalar() or 0

    data = {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "plan": current_user.plan,
        "is_paid": current_user.is_paid,
        "can_use_ai_analysis": current_user.can_use_ai_analysis,
        "can_send_email_alert": current_user.can_send_email_alert,
        "email_alerts_this_month": current_user.email_alerts_this_month,
        "farms_count": farms_count,
        "created_at": current_user.created_at,
    }
    return data


@router.patch("/me", response_model=UserProfileResponse)
async def update_my_profile(
    body: UserProfileUpdate, current_user: CurrentUser, db: DBSession
) -> dict:
    if body.full_name is not None:
        current_user.full_name = body.full_name
    await db.commit()
    await db.refresh(current_user)
    return await get_my_profile(current_user, db)


@router.get("/me/plan-limits")
async def get_plan_limits(current_user: CurrentUser, db: DBSession) -> dict:
    """Retorna los límites del plan actual y cuánto se ha usado."""
    farm_count_result = await db.execute(
        select(func.count()).where(Farm.user_id == current_user.user_id)
    )
    farms_count = farm_count_result.scalar() or 0

    if current_user.is_paid:
        return {
            "plan": "paid",
            "farms": {"used": farms_count, "limit": None, "unlimited": True},
            "ai_analysis": {"allowed": True},
            "email_alerts": {"used": current_user.email_alerts_this_month, "limit": None, "unlimited": True},
        }

    return {
        "plan": "free",
        "farms": {
            "used": farms_count,
            "limit": UserProfile.FREE_MAX_FARMS,
            "unlimited": False,
            "remaining": max(0, UserProfile.FREE_MAX_FARMS - farms_count),
        },
        "ai_analysis": {"allowed": False, "reason": "Requiere plan Surqo Pro"},
        "email_alerts": {
            "used": current_user.email_alerts_this_month,
            "limit": UserProfile.FREE_MAX_EMAIL_ALERTS_MONTH,
            "unlimited": False,
            "remaining": max(0, UserProfile.FREE_MAX_EMAIL_ALERTS_MONTH - current_user.email_alerts_this_month),
        },
    }


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.patch("/{user_id}/plan", response_model=UserProfileResponse)
async def admin_update_plan(
    user_id: uuid.UUID,
    body: UserPlanUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """Solo admins pueden cambiar el plan de un usuario."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden cambiar planes")

    if body.plan not in ("free", "paid"):
        raise HTTPException(status_code=422, detail="Plan debe ser 'free' o 'paid'")

    target = await db.get(UserProfile, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    target.plan = body.plan
    if body.plan == "paid":
        target.plan_activated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(target)

    farm_count_result = await db.execute(
        select(func.count()).where(Farm.user_id == target.user_id)
    )
    farms_count = farm_count_result.scalar() or 0
    return {
        "user_id": target.user_id,
        "email": target.email,
        "full_name": target.full_name,
        "plan": target.plan,
        "is_paid": target.is_paid,
        "can_use_ai_analysis": target.can_use_ai_analysis,
        "can_send_email_alert": target.can_send_email_alert,
        "email_alerts_this_month": target.email_alerts_this_month,
        "farms_count": farms_count,
        "created_at": target.created_at,
    }
