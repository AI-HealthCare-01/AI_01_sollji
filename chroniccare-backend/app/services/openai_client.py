from functools import lru_cache
import logging

from openai import AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@lru_cache()
def get_openai_client() -> AsyncOpenAI:
    settings = get_settings()
    return AsyncOpenAI(
        api_key=settings.openai_api_key,
        timeout=60.0,
        max_retries=1,
    )


async def warm_openai_connection() -> None:
    settings = get_settings()
    if not settings.openai_api_key:
        return

    try:
        client = get_openai_client()
        await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return exactly OK."},
                {"role": "user", "content": "OK"},
            ],
            temperature=0,
            max_tokens=5,
        )
        logger.info("[OpenAI 워밍업 완료]")
    except Exception as exc:
        logger.warning("[OpenAI 워밍업 실패] %s", exc)
