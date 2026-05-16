from __future__ import annotations

import uuid
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import UserProfile

DBSession = Annotated[AsyncSession, Depends(get_db)]

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> UserProfile:
    """Verifica el JWT de Supabase Auth y retorna (o crea) el UserProfile."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado. Vuelve a iniciar sesión.")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {e}")

    user_id_str = payload.get("sub")
    email = payload.get("email") or ""
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Token sin sub claim")

    user_id = uuid.UUID(user_id_str)
    profile = await db.get(UserProfile, user_id)

    if profile is None:
        # Primera vez que este usuario llega — crear perfil automáticamente
        profile = UserProfile(
            user_id=user_id,
            email=email,
            full_name=payload.get("user_metadata", {}).get("full_name"),
            plan="free",
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> UserProfile | None:
    """Versión opcional de get_current_user — retorna None si no hay token."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


async def require_paid_plan(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Dependencia que exige plan de pago. Retorna 402 si es free."""
    if not current_user.is_paid:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "code": "PLAN_REQUIRED",
                "message": "Esta función requiere el plan Surqo Pro.",
                "upgrade_url": "/upgrade",
            },
        )
    return current_user


# Anotaciones de tipo para usar como parámetros en endpoints
CurrentUser = Annotated[UserProfile, Depends(get_current_user)]
CurrentUserOptional = Annotated[UserProfile | None, Depends(get_current_user_optional)]
PaidUser = Annotated[UserProfile, Depends(require_paid_plan)]
