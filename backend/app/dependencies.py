from __future__ import annotations

import json
import uuid
from functools import lru_cache
from typing import Annotated

import logging
import jwt
from jwt.algorithms import ECAlgorithm
from fastapi import Depends, HTTPException, status

logger = logging.getLogger(__name__)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import UserProfile

DBSession = Annotated[AsyncSession, Depends(get_db)]

_bearer = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _supabase_public_key():
    """Construye la clave pública EC de Supabase desde las coordenadas JWK."""
    jwk = {
        "kty": "EC",
        "crv": "P-256",
        "alg": "ES256",
        "x": settings.SUPABASE_JWK_X,
        "y": settings.SUPABASE_JWK_Y,
    }
    return ECAlgorithm.from_jwk(json.dumps(jwk))


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> UserProfile:
    """Verifica el JWT de Supabase Auth (ES256) y retorna (o crea) el UserProfile."""
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
            _supabase_public_key(),
            algorithms=["ES256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado. Vuelve a iniciar sesión.")
    except jwt.InvalidTokenError as e:
        logger.error("JWT verification failed: %s | JWK_X set: %s", e, bool(settings.SUPABASE_JWK_X))
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


# Anotaciones de tipo para usar como parámetros en endpoints
CurrentUser = Annotated[UserProfile, Depends(get_current_user)]
CurrentUserOptional = Annotated[UserProfile | None, Depends(get_current_user_optional)]
# Todo es gratuito — PaidUser es alias de CurrentUser sin restricciones
PaidUser = Annotated[UserProfile, Depends(get_current_user)]
