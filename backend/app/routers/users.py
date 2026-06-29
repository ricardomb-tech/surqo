from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func, select

from app.dependencies import CurrentUser, DBSession
from app.models.farm import Farm
from app.models.user import UserProfile
from app.schemas.user import UserPlanUpdate, UserProfileResponse, UserProfileUpdate

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/me", response_model=UserProfileResponse)
@limiter.limit("60/minute")
async def get_my_profile(request: Request, current_user: CurrentUser, db: DBSession) -> dict:
    """Retorna el perfil del usuario autenticado con stats actualizados."""
    farms_result = await db.execute(
        select(Farm).where(Farm.user_id == current_user.user_id).order_by(Farm.created_at.desc())
    )
    farms = farms_result.scalars().all()

    is_paid = current_user.is_paid or current_user.is_admin

    data = {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "bio": current_user.bio,
        "avatar_url": current_user.avatar_url,
        "cover_url": current_user.cover_url,
        "plan": current_user.plan,
        "is_paid": is_paid,
        "can_use_ai_analysis": current_user.can_use_ai_analysis,
        "can_send_email_alert": current_user.can_send_email_alert,
        "email_alerts_this_month": current_user.email_alerts_this_month,
        "farms_count": len(farms),
        "analyses_used": current_user.analyses_used,
        "analyses_limit": None if is_paid else current_user.FREE_ANALYSES_LIMIT,
        "analyses_remaining": current_user.analyses_remaining,
        "tokens_used": current_user.tokens_used,
        "tokens_limit": None if is_paid else current_user.FREE_TOKENS_LIMIT,
        "tokens_remaining": current_user.tokens_remaining,
        "can_use_chat": current_user.can_use_chat,
        "created_at": current_user.created_at,
        "farms": [
            {
                "id": str(f.id),
                "name": f.name,
                "crop_type": f.crop_type,
                "area_hectares": float(f.area_hectares) if f.area_hectares else None,
                "municipality": f.municipality,
                "department": f.department,
            }
            for f in farms
        ],
    }
    return data


@router.patch("/me", response_model=UserProfileResponse)
@limiter.limit("20/minute")
async def update_my_profile(
    request: Request, body: UserProfileUpdate, current_user: CurrentUser, db: DBSession
) -> dict:
    for field in ("full_name", "phone", "bio", "avatar_url", "cover_url"):
        value = getattr(body, field, None)
        if value is not None:
            setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return await get_my_profile(current_user, db)


@router.get("/me/plan-limits")
async def get_plan_limits(current_user: CurrentUser, db: DBSession) -> dict:
    """Retorna el uso actual del usuario."""
    farm_count_result = await db.execute(
        select(func.count()).where(Farm.user_id == current_user.user_id)
    )
    farms_count = farm_count_result.scalar() or 0

    is_paid = current_user.is_paid or current_user.is_admin
    return {
        "plan": current_user.plan,
        "farms": {
            "used": farms_count,
            "limit": None if is_paid else UserProfile.MAX_FARMS,
            "unlimited": is_paid,
            "remaining": None if is_paid else max(0, UserProfile.MAX_FARMS - farms_count),
        },
        "ai_analysis": {
            "allowed": current_user.can_use_ai_analysis,
            "used": current_user.analyses_used,
            "limit": None if is_paid else UserProfile.FREE_ANALYSES_LIMIT,
            "remaining": current_user.analyses_remaining,
            "tokens_used": current_user.tokens_used,
            "tokens_limit": None if is_paid else UserProfile.FREE_TOKENS_LIMIT,
            "max_tokens_per_analysis": current_user.max_output_tokens,
        },
        "email_alerts": {
            "unlimited": True,
            "used_this_month": current_user.email_alerts_this_month,
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
        target.plan_activated_at = datetime.now(UTC)

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
