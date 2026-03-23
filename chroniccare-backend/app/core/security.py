from datetime import datetime, timedelta
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User


http_bearer = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _get_jwt_config() -> tuple[str, str, int]:
    settings = get_settings()
    if not settings.secret_key:
        raise RuntimeError("JWT secret_key가 설정되지 않았습니다.")
    return settings.secret_key, settings.algorithm, settings.access_token_expire_minutes


def create_access_token(data: dict[str, Any]) -> str:
    secret_key, algorithm, expire_minutes = _get_jwt_config()
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret_key, algorithm=algorithm)


def decode_access_token(token: str) -> dict[str, Any] | None:
    secret_key, algorithm, _ = _get_jwt_config()
    try:
        return jwt.decode(token, secret_key, algorithms=[algorithm])
    except JWTError:
        return None


async def get_current_user(
    credentials = Depends(http_bearer),  # ✅ HTTPBearer로 교체
    db: AsyncSession = Depends(get_db)
):
    token = credentials.credentials  # ✅ 토큰 추출 방식 변경

    credentials_exception = HTTPException(
        status_code=401,
        detail="인증 정보가 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except (JWTError, RuntimeError, AttributeError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user
