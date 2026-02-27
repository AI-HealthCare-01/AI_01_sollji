# routers/chat.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.services.chat_service import chat_with_gpt, end_session

router = APIRouter()


# ── Request / Response 스키마 ──────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None   # 기존 세션 이어가기
    guide_id: Optional[int] = None     # 분석 결과 기반 채팅

class ChatResponse(BaseModel):
    session_id: int
    message: str
    role: str

class SessionHistoryResponse(BaseModel):
    session_id: int
    role: str
    content: str
    created_at: str


# ── 엔드포인트 ─────────────────────────────────────────────

@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GPT 건강 상담 채팅
    - session_id 없으면 새 세션 자동 생성
    - session_id 있으면 기존 세션 이어서 대화
    - guide_id 있으면 분석 결과 기반 맥락 채팅
    """
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
        guide_id=request.guide_id
    )
    return result


@router.get("/sessions", status_code=status.HTTP_200_OK)
async def get_my_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내 채팅 세션 목록 조회"""
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


@router.get("/sessions/{session_id}/messages", status_code=status.HTTP_200_OK)
async def get_session_messages(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 세션의 대화 기록 조회"""
    # 세션 소유자 확인
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

    # 메시지 조회
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


@router.patch("/sessions/{session_id}/end", status_code=status.HTTP_200_OK)
async def end_chat_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """채팅 세션 종료"""
    success = await end_session(db, current_user.id, session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="세션을 찾을 수 없습니다."
        )
    return {"message": "세션이 종료되었습니다.", "session_id": session_id}
