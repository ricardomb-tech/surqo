from __future__ import annotations

import json
import uuid
import urllib.request
from functools import lru_cache
from typing import Annotated

import logging
import jwt
from jwt.algorithms import ECAlgorithm, RSAAlgorithm
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
def _fetch_jwks_keys() -> list:
    """Descarga las claves públicas desde el endpoint JWKS de Supabase."""
    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    try:
        with urllib.request.urlopen(jwks_url, timeout=5) as resp:
            data = json.loads(resp.read())
        keys = []
        for jwk in data.get("keys", []):
            alg = jwk.get("alg", "")
            if alg == "ES256" or jwk.get("kty") == "EC":
                keys.append(("ES256", ECAlgorithm.from_jwk(json.dumps(jwk))))
            elif alg in ("RS256", "RS384", "RS512") or jwk.get("kty") == "RSA":
                keys.append((alg or "RS256", RSAAlgorithm.from_jwk(json.dumps(jwk))))
        logger.info("JWKS loaded: %d key(s) from %s", len(keys), jwks_url)
        return keys
    except Exception as e:
        logger.warning("Could not fetch JWKS from %s: %s", jwks_url, e)
        return []


def _decode_token(token: str) -> dict:
    """
    Verifica el JWT de Supabase en este orden:
    1. JWKS dinámico desde /auth/v1/.well-known/jwks.json (nuevo sistema de Supabase)
    2. HS256 con SUPABASE_JWT_SECRET (legacy)
    3. ES256 con coordenadas JWK manuales (SUPABASE_JWK_X/Y)
    """
    errors = []

    # 1. JWKS dinámico (nuevo sistema de Supabase con JWT Signing Keys)
    if settings.SUPABASE_URL:
        for alg, key in _fetch_jwks_keys():
            try:
                return jwt.decode(
                    token,
                    key,
                    algorithms=[alg],
                    audience="authenticated",
                )
            except jwt.ExpiredSignatureError:
                raise
            except jwt.InvalidTokenError as e:
                errors.append(f"JWKS/{alg}: {e}")

    # 2. HS256 con secret legacy
    if settings.SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.ExpiredSignatureError:
            raise
        except jwt.InvalidTokenError as e:
            errors.append(f"HS256: {e}")

    # 3. ES256 con coordenadas JWK manuales
    if settings.SUPABASE_JWK_X and settings.SUPABASE_JWK_Y:
        try:
            jwk = {
                "kty": "EC", "crv": "P-256", "alg": "ES256",
                "x": settings.SUPABASE_JWK_X, "y": settings.SUPABASE_JWK_Y,
            }
            key = ECAlgorithm.from_jwk(json.dumps(jwk))
            return jwt.decode(token, key, algorithms=["ES256"], audience="authenticated")
        except jwt.ExpiredSignatureError:
            raise
        except jwt.InvalidTokenError as e:
            errors.append(f"ES256-manual: {e}")

    raise jwt.InvalidTokenError(
        f"No se pudo verificar el token. Errores: {'; '.join(errors) or 'Sin claves configuradas'}"
    )


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
        payload = _decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado. Vuelve a iniciar sesión.")
    except jwt.InvalidTokenError as e:
        logger.error("JWT verification failed: %s", e)
        raise HTTPException(status_code=401, detail=f"Token inválido: {e}")

    user_id_str = payload.get("sub")
    email = payload.get("email") or ""
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Token sin sub claim")

    user_id = uuid.UUID(user_id_str)
    profile = await db.get(UserProfile, user_id)

    if profile is None:
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


CurrentUser = Annotated[UserProfile, Depends(get_current_user)]
CurrentUserOptional = Annotated[UserProfile | None, Depends(get_current_user_optional)]
PaidUser = Annotated[UserProfile, Depends(get_current_user)]
