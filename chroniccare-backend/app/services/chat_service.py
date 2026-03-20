# services/chat_service.py
import json
import os
import asyncio
from typing import AsyncGenerator
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.chat import ChatSession, ChatMessage
from app.core.config import get_settings
import time
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────
# OpenAI 클라이언트 — Lazy 싱글톤
# ─────────────────────────────────────────
_openai_client: AsyncOpenAI | None = None

def get_openai_client() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        settings = get_settings()
        api_key = settings.openai_api_key
        if not api_key:
            raise ValueError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
        _openai_client = AsyncOpenAI(api_key=api_key)
    return _openai_client


# ─────────────────────────────────────────
# seed_knowledge.json 로드 (1회)
# ─────────────────────────────────────────
KNOWLEDGE_PATH = os.path.join(os.path.dirname(__file__), "../data/seed_knowledge.json")

def load_knowledge() -> str:
    try:
        with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        lines = []
        for item in data:
            lines.append(f"[{item['category']}] {item['title']}: {item['content']}")
        return "\n\n".join(lines)
    except Exception:
        return ""

KNOWLEDGE_CONTEXT = load_knowledge()

BASE_SYSTEM_PROMPT = f"""당신은 정형외과 전문 AI 건강 상담사입니다.
환자의 약물, 재활, 만성질환 관련 질문에 친절하고 정확하게 답변합니다.

아래는 참고할 전문 지식입니다:
---
{KNOWLEDGE_CONTEXT}
---

답변 규칙:
1. 위 지식을 바탕으로 정확한 정보를 제공하세요.
2. 심각한 증상(호흡 곤란, 흉통, 의식 저하 등)은 즉시 응급실 방문을 권고하세요.
3. 약물 용량 변경이나 처방 변경은 반드시 담당 의사와 상담하도록 안내하세요.
4. 답변은 한국어로, 친절하고 이해하기 쉽게 작성하세요.
5. 불확실한 내용은 추측하지 말고 의사 상담을 권유하세요.
"""


# ─────────────────────────────────────────
# [신규] 분석 결과 컨텍스트 로드
# ─────────────────────────────────────────
async def load_guide_context(db: AsyncSession, guide_id: int) -> str:
    """
    guide_id로 분석 결과를 조회해서 LLM 프롬프트에 주입할 텍스트 생성.

    왜 필요한가:
    - 사용자가 분석 결과 화면에서 챗봇을 열면 guide_id가 전달됨
    - 이 정보를 LLM에 주입해야 "이 환자의 처방"에 맞는 답변 가능
    - 안전점수(safety_score)는 의료 윤리상 제외
    """
    try:
        # GuideResult 모델 import (순환참조 방지를 위해 함수 내부에서)
        from app.models.analysis import GuideResult

        result = await db.execute(
            select(GuideResult).where(GuideResult.id == guide_id)
        )
        guide = result.scalar_one_or_none()

        if not guide:
            return ""

        # 있는 필드만 포함 (None이면 건너뜀)
        parts = ["[현재 사용자의 처방 분석 정보]"]

        if getattr(guide, "summary", None):
            parts.append(f"- 분석 요약: {guide.summary}")

        if getattr(guide, "medication_guide", None):
            # 너무 길면 앞 500자만
            guide_text = guide.medication_guide[:500]
            parts.append(f"- 복약 안내: {guide_text}")

        if getattr(guide, "lifestyle_guide", None):
            parts.append(f"- 생활습관 안내: {guide.lifestyle_guide[:300]}")

        if getattr(guide, "caution", None):
            parts.append(f"- 주의사항: {guide.caution}")

        if len(parts) == 1:
            # 내용이 하나도 없으면 빈 문자열 반환
            return ""

        parts.append("※ 위 정보는 참고용이며, 정확한 판단은 담당 의사와 상담하세요.")
        return "\n".join(parts)

    except Exception as e:
        logger.warning(f"[Chat] guide_context 로드 실패 (guide_id={guide_id}): {e}")
        return ""


def build_system_prompt(guide_context: str) -> str:
    """
    기본 시스템 프롬프트 + 환자 분석 결과 컨텍스트 합치기.
    guide_context가 없으면 기본 프롬프트만 사용.
    """
    if not guide_context:
        return BASE_SYSTEM_PROMPT

    return BASE_SYSTEM_PROMPT + f"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{guide_context}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
위 환자 정보를 반드시 참고하여 개인화된 답변을 제공하세요.
"""


# ─────────────────────────────────────────
# Mock
# ─────────────────────────────────────────
MOCK_REPLIES = [
    "안녕하세요! 건강 관련 궁금한 점을 편하게 물어보세요 😊",
    "아목시실린은 식사와 관계없이 복용 가능하지만, 위장 불편감이 있다면 식후 복용을 권장합니다.",
    "이부프로펜은 공복에 복용하면 위장 장애가 생길 수 있으니 반드시 식후에 복용하세요.",
    "증상이 지속된다면 담당 의사와 상담하시는 것을 권장합니다.",
]
_mock_reply_index = 0

async def _mock_chat(user_message: str) -> str:
    global _mock_reply_index
    reply = MOCK_REPLIES[_mock_reply_index % len(MOCK_REPLIES)]
    _mock_reply_index += 1
    return reply


# ─────────────────────────────────────────
# 세션 / 메시지 헬퍼
# ─────────────────────────────────────────
async def get_or_create_session(
    db: AsyncSession,
    user_id: int,
    session_id: int | None,
    guide_id: int | None,
    user_message: str = "",
) -> ChatSession:
    if session_id == 0:
        session_id = None
    if guide_id == 0:
        guide_id = None

    if session_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
                ChatSession.session_status == "ACTIVE",
            )
        )
        session = result.scalar_one_or_none()
        if session:
            return session

    # 첫 메시지 앞 30자를 title로 저장
    title = user_message[:30] if user_message else "새 대화"

    new_session = ChatSession(
        user_id=user_id,
        related_guide_id=guide_id,
        context_type="general" if not guide_id else "guide",
        context_id=guide_id,
        title=title,
        session_status="ACTIVE",
    )
    db.add(new_session)
    await db.flush()
    return new_session


async def get_session_messages(
    db: AsyncSession,
    session_id: int,
) -> list[dict]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(20)
    )
    messages = result.scalars().all()
    return [{"role": msg.role, "content": msg.content} for msg in messages]


# ─────────────────────────────────────────
# 일반 응답 (기존 방식 — 하위 호환 유지)
# ─────────────────────────────────────────
async def chat_with_gpt(
    db: AsyncSession,
    user_id: int,
    user_message: str,
    session_id: int | None = None,
    guide_id: int | None = None,
) -> dict:

    # 1. 세션 조회/생성
    session = await get_or_create_session(db, user_id, session_id, guide_id, user_message)

    # 2. 이전 대화 기록
    history = await get_session_messages(db, session.id)

    # 3. Mock vs Real
    settings = get_settings()
    use_mock = getattr(settings, "use_mock_chat", False)

    if use_mock:
        assistant_reply = await _mock_chat(user_message)
    else:
        # 분석 결과 컨텍스트 로드
        # session.related_guide_id 또는 파라미터로 받은 guide_id 사용
        effective_guide_id = guide_id or getattr(session, "related_guide_id", None)
        guide_context = ""
        if effective_guide_id:
            guide_context = await load_guide_context(db, effective_guide_id)

        # 컨텍스트 포함된 시스템 프롬프트 생성
        system_prompt = build_system_prompt(guide_context)

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        client = get_openai_client()
        start = time.time()

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0,
        )

        latency_ms = int((time.time() - start) * 1000)
        usage = response.usage
        logger.info(
            f"[LLM] chat | latency={latency_ms}ms | "
            f"prompt_tokens={usage.prompt_tokens} | "
            f"completion_tokens={usage.completion_tokens} | "
            f"total_tokens={usage.total_tokens}"
        )

        assistant_reply = response.choices[0].message.content

    # 4. 메시지 저장
    db.add(ChatMessage(session_id=session.id, role="user", content=user_message))
    db.add(ChatMessage(session_id=session.id, role="assistant", content=assistant_reply))
    await db.commit()

    return {
        "session_id": session.id,
        "message": assistant_reply,
        "role": "assistant",
    }


# ─────────────────────────────────────────
# Streaming 응답
# ─────────────────────────────────────────
async def chat_with_gpt_stream(
    db: AsyncSession,
    user_id: int,
    user_message: str,
    session_id: int | None = None,
    guide_id: int | None = None,
) -> AsyncGenerator[str, None]:
    """
    SSE 스트리밍 응답 생성기.

    왜 일반 응답과 별도 함수인가:
    - 스트리밍은 응답을 조각(chunk)으로 yield해야 함
    - 일반 함수는 return으로 한번에 반환
    - 두 방식은 구조가 달라서 분리하는 게 깔끔함
    - 기존 chat_with_gpt는 그대로 유지 (하위 호환)

    SSE 포맷:
    - 각 토큰: "data: 안녕\n\n"
    - 완료 신호: "data: [DONE]\n\n"
    - 에러: "data: [ERROR] 메시지\n\n"
    """

    # 1. 세션 조회/생성
    session = await get_or_create_session(db, user_id, session_id, guide_id, user_message)

    # 세션 ID를 첫 번째 SSE 이벤트로 즉시 전송
    # 프론트엔드가 이걸 받아서 currentSessionId를 업데이트함
    yield f"data: [SESSION_ID:{session.id}]\n\n"

    # 2. 이전 대화 기록
    history = await get_session_messages(db, session.id)

    # 3. 사용자 메시지 먼저 저장 (스트리밍 중 DB 저장이 필요하므로)
    db.add(ChatMessage(session_id=session.id, role="user", content=user_message))
    await db.flush()  # commit은 아직 안 함

    # 4. Mock 분기
    settings = get_settings()
    use_mock = getattr(settings, "use_mock_chat", False)

    if use_mock:
        # Mock도 스트리밍처럼 보이게 — 단어 단위로 나눠서 yield
        mock_reply = await _mock_chat(user_message)
        for word in mock_reply.split(" "):
            yield f"data: {word} \n\n"
            await asyncio.sleep(0.05)  # 타이핑 효과
        yield "data: [DONE]\n\n"

        db.add(ChatMessage(session_id=session.id, role="assistant", content=mock_reply))
        await db.commit()
        return

    # 5. 분석 결과 컨텍스트 로드
    effective_guide_id = guide_id or getattr(session, "related_guide_id", None)
    guide_context = ""
    if effective_guide_id:
        guide_context = await load_guide_context(db, effective_guide_id)

    system_prompt = build_system_prompt(guide_context)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    client = get_openai_client()
    full_response = ""  # 스트리밍 완료 후 DB 저장용

    try:
        start = time.time()

        # ★ stream=True — 토큰 단위로 받기
        stream = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0,
            stream=True,
        )

        first_token_logged = False

        async for chunk in stream:
            # 토큰 추출
            delta = chunk.choices[0].delta
            token = delta.content

            if token is None:
                continue

            # 첫 토큰 latency 로그 (체감 응답속도 측정)
            if not first_token_logged:
                first_token_ms = int((time.time() - start) * 1000)
                logger.info(f"[LLM] stream first_token | latency={first_token_ms}ms")
                first_token_logged = True

            full_response += token

            # SSE 포맷으로 전송
            # 줄바꿈이 포함된 토큰은 이스케이프 처리
            safe_token = token.replace("\n", "\\n")
            yield f"data: {safe_token}\n\n"

        # 스트리밍 완료
        total_ms = int((time.time() - start) * 1000)
        logger.info(f"[LLM] stream complete | total_latency={total_ms}ms")

        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"[LLM] stream error: {e}")
        yield f"data: [ERROR] 일시적인 오류가 발생했습니다.\n\n"
        await db.rollback()
        return

    # 6. 완성된 전체 응답을 DB에 저장
    db.add(ChatMessage(
        session_id=session.id,
        role="assistant",
        content=full_response
    ))
    await db.commit()


# ─────────────────────────────────────────
# 세션 종료
# ─────────────────────────────────────────
async def end_session(
    db: AsyncSession,
    user_id: int,
    session_id: int,
) -> bool:
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        return False

    from sqlalchemy.sql import func
    session.session_status = "ENDED"
    session.ended_at = func.now()
    await db.commit()
    return True
