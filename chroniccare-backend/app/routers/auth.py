from sqlalchemy import select
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import create_access_token
from app.core.security import get_current_user
from app.models.analysis import GuideResult, MedicationSchedule
from app.models.chat import ChatSession, Feedback, Notification
from app.models.document import Document, OCRResult
from app.models.rehab import ExerciseCompletion, RehabPlan
from app.models.user import Allergy, ChronicCondition, HealthProfile, Medication, User
from datetime import datetime
from typing import Optional
import bcrypt

router = APIRouter()
PROJECT_ROOT = Path(__file__).resolve().parents[3]


# bcrypt 직접 사용 (passlib 제거)
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NameUpdate(BaseModel):
    name: str

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .options(selectinload(User.health_profile))
        .where(User.email == req.email)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "has_health_profile": user.health_profile is not None
    }


@router.get("/me", response_model=UserResponse)
async def get_me(
        current_user: User = Depends(get_current_user)
):
    # DB 조회 불필요 — current_user가 이미 User 객체
    return current_user  # UserResponse가 알아서 직렬화

# ───  이름 수정 API  ───────────────────────────────────
@router.patch("/me", summary="이름 수정", response_model=UserResponse)
async def update_name(
    body: NameUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.name = body.name
    await db.commit()
    await db.refresh(current_user)
    return current_user

# ───  비밀번호 변경 API ────────────────────────────────────────
@router.patch("/me/password", summary="비밀번호 변경")
async def update_password(
        body: PasswordUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # 1. 현재 비밀번호가 맞는지 확인
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 일치하지 않습니다.")

    # 2. 새 비밀번호 암호화 후 저장
    current_user.password_hash = hash_password(body.new_password)
    await db.commit()

    return {"message": "비밀번호가 성공적으로 변경되었습니다."}


# ─── 🆕 회원 탈퇴 API ────────────────────────────────────────────
@router.delete("/me", summary="회원 탈퇴")
async def delete_account(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    documents_result = await db.execute(
        select(Document.id, Document.file_path).where(Document.user_id == current_user.id)
    )
    documents = documents_result.all()
    document_ids = [row.id for row in documents]

    await db.execute(delete(ExerciseCompletion).where(ExerciseCompletion.user_id == current_user.id))
    await db.execute(delete(RehabPlan).where(RehabPlan.user_id == current_user.id))
    await db.execute(delete(ChatSession).where(ChatSession.user_id == current_user.id))
    await db.execute(delete(MedicationSchedule).where(MedicationSchedule.user_id == current_user.id))
    await db.execute(delete(GuideResult).where(GuideResult.user_id == current_user.id))
    if document_ids:
        await db.execute(delete(OCRResult).where(OCRResult.document_id.in_(document_ids)))
    await db.execute(delete(Notification).where(Notification.user_id == current_user.id))
    await db.execute(delete(Feedback).where(Feedback.user_id == current_user.id))
    await db.execute(delete(Document).where(Document.user_id == current_user.id))
    await db.execute(delete(Medication).where(Medication.user_id == current_user.id))
    await db.execute(delete(Allergy).where(Allergy.user_id == current_user.id))
    await db.execute(delete(ChronicCondition).where(ChronicCondition.user_id == current_user.id))
    await db.execute(delete(HealthProfile).where(HealthProfile.user_id == current_user.id))
    await db.delete(current_user)
    await db.commit()

    for _, file_path in documents:
        if not file_path:
            continue
        try:
            resolved_path = Path(file_path)
            if not resolved_path.is_absolute():
                resolved_path = PROJECT_ROOT / resolved_path
            resolved_path.unlink(missing_ok=True)
        except OSError:
            pass

    return {"message": "회원 탈퇴가 완료되었습니다."}
