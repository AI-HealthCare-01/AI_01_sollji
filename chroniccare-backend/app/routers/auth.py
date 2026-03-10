from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.models.user import User
from app.core.security import create_access_token
from app.core.security import get_current_user
import bcrypt

router = APIRouter()


# ✅ bcrypt 직접 사용 (passlib 제거)
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

    class Config:
        from_attributes = True


# 🆕 비밀번호 변경 스키마 추가
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
        password_hash=hash_password(req.password),  # ✅ 변경
        name=req.name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):  # ✅ 변경
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name
    }


@router.get("/me", response_model=UserResponse)
async def get_me(
        current_user: User = Depends(get_current_user)  # ✅ User 객체 직접 받기
):
    # ✅ DB 조회 불필요 — current_user가 이미 User 객체
    return current_user  # ✅ UserResponse가 알아서 직렬화


# ─── 🆕 비밀번호 변경 API ────────────────────────────────────────
@router.put("/me/password", summary="비밀번호 변경")
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
    # SQLAlchemy 모델(User)에 cascade="all, delete-orphan"이 설정되어 있다면
    # 유저 삭제 시 프로필, 처방전, 재활 기록 등도 자동으로 함께 깔끔하게 삭제됩니다.
    await db.delete(current_user)
    await db.commit()

    return {"message": "회원 탈퇴가 완료되었습니다."}
