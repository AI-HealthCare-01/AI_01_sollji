from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, ChronicCondition, Medication, Allergy, HealthProfile

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
    condition = ChronicCondition(
        user_id=current_user.id,
        condition_type=body.condition_type,
        diagnosed_date=body.diagnosed_date,
        severity=body.severity,
        notes=body.notes
    )
    db.add(condition)
    await db.commit()
    await db.refresh(condition)
    return {"id": condition.id, "condition_type": condition.condition_type}


@router.get("/conditions", summary="기저질환 조회")
async def get_conditions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ChronicCondition).where(ChronicCondition.user_id == current_user.id)
    )
    return result.scalars().all()


@router.delete("/conditions/{condition_id}", summary="기저질환 삭제")
async def delete_condition(
    condition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ChronicCondition).where(
            ChronicCondition.id == condition_id,
            ChronicCondition.user_id == current_user.id
        )
    )
    condition = result.scalar_one_or_none()
    if not condition:
        raise HTTPException(status_code=404, detail="기저질환을 찾을 수 없습니다")
    await db.delete(condition)
    await db.commit()
    return {"message": "삭제되었습니다"}


# ─── 복용약 ──────────────────────────────────────────────────

@router.post("/medications", summary="복용약 등록")
async def add_medication(
    body: MedicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    medication = Medication(
        user_id=current_user.id,
        medication_name=body.medication_name,
        dosage=body.dosage or "",
        frequency=body.frequency or 1,
        timing=body.timing or {},
        medication_type=body.medication_type or "기타",
        is_active=True
    )
    db.add(medication)
    await db.commit()
    await db.refresh(medication)
    return {"id": medication.id, "medication_name": medication.medication_name}


@router.get("/medications", summary="복용약 조회")
async def get_medications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Medication).where(
            Medication.user_id == current_user.id,
            Medication.is_active == True
        )
    )
    return result.scalars().all()


@router.delete("/medications/{medication_id}", summary="복용약 삭제")
async def delete_medication(
    medication_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Medication).where(
            Medication.id == medication_id,
            Medication.user_id == current_user.id
        )
    )
    medication = result.scalar_one_or_none()
    if not medication:
        raise HTTPException(status_code=404, detail="복용약을 찾을 수 없습니다")
    medication.is_active = False
    await db.commit()
    return {"message": "삭제되었습니다"}


# ─── 알레르기 ─────────────────────────────────────────────────

@router.post("/allergies", summary="알레르기 등록")
async def add_allergy(
    body: AllergyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    allergy = Allergy(
        user_id=current_user.id,
        allergen_name=body.allergen_name,
        allergen_type=body.allergen_type,
        severity=body.severity,
        reaction_description=body.reaction_description
    )
    db.add(allergy)
    await db.commit()
    await db.refresh(allergy)
    return {"id": allergy.id, "allergen_name": allergy.allergen_name}


@router.get("/allergies", summary="알레르기 조회")
async def get_allergies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Allergy).where(Allergy.user_id == current_user.id)
    )
    return result.scalars().all()


@router.delete("/allergies/{allergy_id}", summary="알레르기 삭제")
async def delete_allergy(
    allergy_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Allergy).where(
            Allergy.id == allergy_id,
            Allergy.user_id == current_user.id
        )
    )
    allergy = result.scalar_one_or_none()
    if not allergy:
        raise HTTPException(status_code=404, detail="알레르기를 찾을 수 없습니다")
    await db.delete(allergy)
    await db.commit()
    return {"message": "삭제되었습니다"}


# ─── 건강 프로필 ──────────────────────────────────────────────

@router.post("/health", summary="건강 프로필 등록/수정")
async def upsert_health_profile(
    body: HealthProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if profile:
        for key, value in body.dict(exclude_none=True).items():
            setattr(profile, key, value)
    else:
        profile = HealthProfile(
            user_id=current_user.id,
            **body.dict(exclude_none=True)
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)
    return profile


# ─── 전체 프로필 조회 ─────────────────────────────────────────

@router.get("/me", summary="전체 프로필 조회")
async def get_full_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conditions = (await db.execute(
        select(ChronicCondition).where(ChronicCondition.user_id == current_user.id)
    )).scalars().all()

    medications = (await db.execute(
        select(Medication).where(
            Medication.user_id == current_user.id,
            Medication.is_active == True
        )
    )).scalars().all()

    allergies = (await db.execute(
        select(Allergy).where(Allergy.user_id == current_user.id)
    )).scalars().all()

    health = (await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == current_user.id)
    )).scalar_one_or_none()

    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name
        },
        "conditions": conditions,
        "medications": medications,
        "allergies": allergies,
        "health_profile": health
    }
