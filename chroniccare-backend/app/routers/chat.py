# routers/chat.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.services.chat_service import chat_with_gpt, chat_with_gpt_stream, end_session

router = APIRouter()


# ── 스키마 ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None
    guide_id: Optional[int] = None

class ChatResponse(BaseModel):
    session_id: int
    message: str
    role: str


# ── 일반 응답 (기존 — 유지) ───────────────────────────────

@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="메시지를 입력해주세요."
        )

    result = await chat_with_gpt(
        db=db,
        user_id=current_user.id,
        user_message=request.message,
        session_id=request.session_id,
        guide_id=request.guide_id,
    )
    return result


# ── [신규] 스트리밍 응답 ──────────────────────────────────

@router.post("/stream", status_code=status.HTTP_200_OK)
async def chat_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    SSE(Server-Sent Events) 스트리밍 챗봇 엔드포인트.

    왜 별도 엔드포인트인가:
    - StreamingResponse는 일반 JSON 응답과 반환 타입이 다름
    - 기존 POST "" 엔드포인트를 건드리면 하위 호환성 깨짐
    - 프론트엔드가 스트리밍/일반 중 선택 가능하도록 분리

    응답 형식 (SSE):
    data: 안녕\n\n
    data: 하세요\n\n
    data: [DONE]\n\n

    프론트엔드에서 fetch + ReadableStream으로 수신
    (Axios는 스트리밍 미지원이므로 fetch 사용)
    """
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="메시지를 입력해주세요."
        )

    return StreamingResponse(
        chat_with_gpt_stream(
            db=db,
            user_id=current_user.id,
            user_message=request.message,
            session_id=request.session_id,
            guide_id=request.guide_id,
        ),
        media_type="text/event-stream",
        headers={
            # 스트리밍에 필요한 헤더들
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # nginx 버퍼링 비활성화
            "Connection": "keep-alive",
        }
    )


# ── 세션 목록 ─────────────────────────────────────────────

@router.get("/sessions", status_code=status.HTTP_200_OK)
async def get_my_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.started_at.desc())
        .limit(20)
    )
    sessions = result.scalars().all()

    return [
        {
            "session_id": s.id,
            "context_type": s.context_type,
            "session_status": s.session_status,
            "related_guide_id": s.related_guide_id,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
        }
        for s in sessions
    ]


# ── 메시지 조회 ───────────────────────────────────────────

@router.get("/sessions/{session_id}/messages", status_code=status.HTTP_200_OK)
async def get_session_messages(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="세션을 찾을 수 없습니다."
        )

    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = msg_result.scalars().all()

    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]


# ── 세션 종료 ─────────────────────────────────────────────

@router.patch("/sessions/{session_id}/end", status_code=status.HTTP_200_OK)
async def end_chat_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = await end_session(db, current_user.id, session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="세션을 찾을 수 없습니다."
        )
    return {"message": "세션이 종료되었습니다.", "session_id": session_id}


# ── 세션 삭제 ─────────────────────────────────────────────

@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def delete_chat_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="세션을 찾을 수 없습니다."
        )

    await db.delete(session)
    await db.commit()
    return {"message": "세션이 삭제되었습니다.", "session_id": session_id}
