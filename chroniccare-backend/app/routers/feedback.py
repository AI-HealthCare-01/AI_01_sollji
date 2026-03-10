from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.chat import Feedback

router = APIRouter()


# ─────────────────────────────────────────
# Request / Response 스키마
# ─────────────────────────────────────────

class FeedbackCreate(BaseModel):
    target_type: str = Field(..., example="guide_result", description="피드백 대상 타입")
    target_id: int = Field(..., example=3, description="피드백 대상 ID")
    rating: Optional[int] = Field(None, ge=1, le=5, description="평점 1~5")
    comment: Optional[str] = Field(None, description="코멘트")
    latency_ms: Optional[int] = Field(None, description="응답 지연 시간 (밀리초)")


class FeedbackResponse(BaseModel):
    id: int
    target_type: str
    target_id: int
    rating: Optional[int]
    comment: Optional[str]
    latency_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# POST /feedback — 피드백 등록
# ─────────────────────────────────────────

@router.post("", response_model=FeedbackResponse, status_code=201, summary="피드백 등록")
async def create_feedback(
    body: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    feedback = Feedback(
        user_id=current_user.id,
        target_type=body.target_type,
        target_id=body.target_id,
        rating=body.rating,
        comment=body.comment,
        latency_ms=body.latency_ms,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


# ─────────────────────────────────────────
# GET /feedback — 내 피드백 목록 조회
# ─────────────────────────────────────────

@router.get("", response_model=list[FeedbackResponse], summary="내 피드백 목록 조회")
async def get_my_feedbacks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Feedback)
        .where(Feedback.user_id == current_user.id)
        .order_by(Feedback.created_at.desc())
    )
    return result.scalars().all()


# ─────────────────────────────────────────
# GET /feedback/{feedback_id} — 피드백 단건 조회
# ─────────────────────────────────────────

@router.get("/{feedback_id}", response_model=FeedbackResponse, summary="피드백 단건 조회")
async def get_feedback(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    feedback = await db.get(Feedback, feedback_id)

    if not feedback or feedback.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="피드백을 찾을 수 없습니다.")

    return feedback


# ─────────────────────────────────────────
# DELETE /feedback/{feedback_id} — 피드백 삭제
# ─────────────────────────────────────────

@router.delete("/{feedback_id}", status_code=204, summary="피드백 삭제")
async def delete_feedback(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    feedback = await db.get(Feedback, feedback_id)

    if not feedback or feedback.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="피드백을 찾을 수 없습니다.")

    await db.delete(feedback)
    await db.commit()
