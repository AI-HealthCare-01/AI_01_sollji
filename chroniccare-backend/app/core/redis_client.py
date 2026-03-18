# app/core/redis_client.py

import json
import logging
from typing import Optional, Any
import redis.asyncio as aioredis

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> Optional[aioredis.Redis]:
    """
    Redis 클라이언트 싱글턴 반환.
    Redis 연결 실패 시 None을 반환해서 캐싱 없이 정상 동작 (Graceful Degradation).
    """
    global _redis_client
    if _redis_client is None:
        try:
            settings = get_settings()
            _redis_client = aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            await _redis_client.ping()
            logger.info("[Redis] 연결 성공")
        except Exception as e:
            logger.warning(f"[Redis] 연결 실패 — 캐싱 없이 동작합니다. ({e})")
            _redis_client = None
    return _redis_client


async def cache_get(key: str) -> Optional[Any]:
    """캐시에서 값 조회. 없거나 실패 시 None 반환."""
    redis = await get_redis()
    if redis is None:
        return None
    try:
        value = await redis.get(key)
        if value:
            logger.debug(f"[Redis] CACHE HIT — {key}")
            return json.loads(value)
        logger.debug(f"[Redis] CACHE MISS — {key}")
        return None
    except Exception as e:
        logger.warning(f"[Redis] cache_get 실패: {e}")
        return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    """캐시에 값 저장. 실패해도 예외 전파 안 함."""
    redis = await get_redis()
    if redis is None:
        return
    try:
        await redis.set(key, json.dumps(value, ensure_ascii=False, default=str), ex=ttl)
        logger.debug(f"[Redis] CACHE SET — {key} (TTL={ttl}s)")
    except Exception as e:
        logger.warning(f"[Redis] cache_set 실패: {e}")


async def cache_delete(pattern: str) -> None:
    """
    패턴 매칭으로 캐시 삭제 (캐시 무효화용).
    예: cache_delete("rehab:plan:42:*")
    """
    redis = await get_redis()
    if redis is None:
        return
    try:
        keys = await redis.keys(pattern)
        if keys:
            await redis.delete(*keys)
            logger.debug(f"[Redis] CACHE DELETE — {len(keys)}개 키 삭제 ({pattern})")
    except Exception as e:
        logger.warning(f"[Redis] cache_delete 실패: {e}")
