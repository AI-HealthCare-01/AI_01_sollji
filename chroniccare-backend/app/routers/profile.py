from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services import profile_service

router = APIRouter()


# ─── Schemas ─────────────────────────────────────────────────

class ConditionCreate(BaseModel):
    condition_type: str
    diagnosed_date: Optional[date] = None
    severity: Optional[str] = None
    notes: Optional[str] = None

class MedicationCreate(BaseModel):
    medication_name: str
    dosage: Optional[str] = None
    frequency: Optional[int] = None
    timing: Optional[dict] = None
    medication_type: Optional[str] = None

class AllergyCreate(BaseModel):
    allergen_name: str
    allergen_type: Optional[str] = None
    severity: Optional[str] = None
    reaction_description: Optional[str] = None

class HealthProfileCreate(BaseModel):
    height: Optional[str] = None
    weight: Optional[str] = None
    blood_type: Optional[str] = None
    smoking_status: Optional[str] = None
    alcohol_frequency: Optional[str] = None
    exercise_frequency: Optional[str] = None


# ─── 기저질환 ─────────────────────────────────────────────────

@router.post("/conditions", summary="기저질환 등록")
async def add_condition(
    body: ConditionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    condition = await profile_service.create_condition(db, current_user.id, body.dict())
    return {"id": condition.id, "condition_type": condition.condition_type}


@router.get("/conditions", summary="기저질환 조회")
async def get_conditions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await profile_service.get_conditions(db, current_user.id)


@router.delete("/conditions/{condition_id}", summary="기저질환 삭제")
async def delete_condition(
    condition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await profile_service.delete_condition(db, current_user.id, condition_id)
    return {"message": "삭제되었습니다"}


# ─── 복용약 ──────────────────────────────────────────────────

@router.post("/medications", summary="복용약 등록")
async def add_medication(
    body: MedicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medication = await profile_service.create_medication(db, current_user.id, body.dict())
    return {"id": medication.id, "medication_name": medication.medication_name}


@router.get("/medications", summary="복용약 조회")
async def get_medications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await profile_service.get_medications(db, current_user.id)


@router.delete("/medications/{medication_id}", summary="복용약 삭제")
async def delete_medication(
    medication_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await profile_service.delete_medication(db, current_user.id, medication_id)
    return {"message": "삭제되었습니다"}


# ─── 알레르기 ─────────────────────────────────────────────────

@router.post("/allergies", summary="알레르기 등록")
async def add_allergy(
    body: AllergyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    allergy = await profile_service.create_allergy(db, current_user.id, body.dict())
    return {"id": allergy.id, "allergen_name": allergy.allergen_name}


@router.get("/allergies", summary="알레르기 조회")
async def get_allergies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await profile_service.get_allergies(db, current_user.id)


@router.delete("/allergies/{allergy_id}", summary="알레르기 삭제")
async def delete_allergy(
    allergy_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await profile_service.delete_allergy(db, current_user.id, allergy_id)
    return {"message": "삭제되었습니다"}


# ─── 건강 프로필 ──────────────────────────────────────────────

@router.get("/health", summary="건강 프로필 조회")
async def get_health_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await profile_service.get_health_profile(db, current_user.id)

@router.post("/health", summary="건강 프로필 등록/수정")
async def upsert_health_profile(
    body: HealthProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await profile_service.upsert_health_profile(
        db, current_user.id, body.dict(exclude_none=True)
    )

# ─── 전체 프로필 조회 ─────────────────────────────────────────

@router.get("/me", summary="전체 프로필 조회")
async def get_full_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await profile_service.get_full_profile(db, current_user)
