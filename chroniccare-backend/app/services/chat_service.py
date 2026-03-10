# services/chat_service.py
import json
import os
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.chat import ChatSession, ChatMessage
from app.core.config import get_settings
import time
import logging

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────
# OpenAI 클라이언트 — 필요할 때(Lazy) 1회만 생성
# ─────────────────────────────────────────

_openai_client: AsyncOpenAI | None = None

def get_openai_client() -> AsyncOpenAI:
    global _openai_client

    # 클라이언트가 아직 안 만들어졌을 때만 새로 만듭니다.
    if _openai_client is None:
        settings = get_settings()
        api_key = settings.OPENAI_API_KEY

        if not api_key:
            raise ValueError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다. (.env 파일을 확인하세요)")

        _openai_client = AsyncOpenAI(api_key=api_key)

    return _openai_client


# ─────────────────────────────────────────
# seed_knowledge.json 로드 (서버 시작 시 1회만)
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

SYSTEM_PROMPT = f"""당신은 정형외과 전문 AI 건강 상담사입니다.
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
# Mock (개발/테스트용 — 건드리지 않음)
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
) -> ChatSession:
    # ✅ 0은 None으로 처리 (Swagger 실수 방어)
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

    new_session = ChatSession(
        user_id=user_id,
        related_guide_id=guide_id,       # None이면 FK 안 걸림
        context_type="general" if not guide_id else "guide",
        context_id=guide_id,             # None이면 OK
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
# 메인 함수
# ─────────────────────────────────────────
async def chat_with_gpt(
    db: AsyncSession,
    user_id: int,
    user_message: str,
    session_id: int | None = None,
    guide_id: int | None = None,
) -> dict:

    # 1. 세션 조회/생성
    session = await get_or_create_session(db, user_id, session_id, guide_id)

    # 2. 이전 대화 기록 조회
    history = await get_session_messages(db, session.id)

    # 3. Mock vs Real 분기
    from app.core.config import get_settings
    settings = get_settings()
    use_mock = getattr(settings, "use_mock_chat", True)

    if use_mock:
        assistant_reply = await _mock_chat(user_message)
    else:
        # GPT 요청
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        client = get_openai_client()

        # ⏱️ latency 측정 시작
        start = time.time()

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0,
        )

        # ⏱️ latency 측정 종료
        latency_ms = int((time.time() - start) * 1000)
        usage = response.usage

        logger.info(
            f"[LLM] chat | latency={latency_ms}ms | "
            f"prompt_tokens={usage.prompt_tokens} | "
            f"completion_tokens={usage.completion_tokens} | "
            f"total_tokens={usage.total_tokens}"
        )

        assistant_reply = response.choices[0].message.content

    # 4. 사용자 메시지 저장
    db.add(ChatMessage(session_id=session.id, role="user", content=user_message))

    # 5. AI 응답 저장
    db.add(ChatMessage(session_id=session.id, role="assistant", content=assistant_reply))

    await db.commit()

    return {
        "session_id": session.id,
        "message": assistant_reply,
        "role": "assistant",
    }


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
