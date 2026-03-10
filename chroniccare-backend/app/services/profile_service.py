from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.user import (
    User, ChronicCondition, Medication, Allergy, HealthProfile
)


# ─── 기저질환 ─────────────────────────────────────────────────

async def create_condition(db: AsyncSession, user_id: int, data: dict) -> ChronicCondition:
    condition = ChronicCondition(
        user_id=user_id,
        condition_type=data["condition_type"],
        diagnosed_date=data.get("diagnosed_date"),
        severity=data.get("severity"),
        notes=data.get("notes")
    )
    db.add(condition)
    await db.commit()
    await db.refresh(condition)
    return condition


async def get_conditions(db: AsyncSession, user_id: int) -> list[ChronicCondition]:
    result = await db.execute(
        select(ChronicCondition).where(ChronicCondition.user_id == user_id)
    )
    return result.scalars().all()


async def delete_condition(db: AsyncSession, user_id: int, condition_id: int):
    result = await db.execute(
        select(ChronicCondition).where(
            ChronicCondition.id == condition_id,
            ChronicCondition.user_id == user_id
        )
    )
    condition = result.scalar_one_or_none()
    if not condition:
        raise HTTPException(status_code=404, detail="기저질환을 찾을 수 없습니다")
    await db.delete(condition)
    await db.commit()


# ─── 복용약 ──────────────────────────────────────────────────

async def create_medication(db: AsyncSession, user_id: int, data: dict) -> Medication:
    medication = Medication(
        user_id=user_id,
        medication_name=data["medication_name"],
        dosage=data.get("dosage") or "",
        frequency=data.get("frequency") or 1,
        timing=data.get("timing") or {},
        medication_type=data.get("medication_type") or "기타",
        is_active=True
    )
    db.add(medication)
    await db.commit()
    await db.refresh(medication)
    return medication


async def get_medications(db: AsyncSession, user_id: int) -> list[Medication]:
    result = await db.execute(
        select(Medication).where(
            Medication.user_id == user_id,
            Medication.is_active == True
        )
    )
    return result.scalars().all()


async def delete_medication(db: AsyncSession, user_id: int, medication_id: int):
    result = await db.execute(
        select(Medication).where(
            Medication.id == medication_id,
            Medication.user_id == user_id
        )
    )
    medication = result.scalar_one_or_none()
    if not medication:
        raise HTTPException(status_code=404, detail="복용약을 찾을 수 없습니다")
    medication.is_active = False
    await db.commit()


# ─── 알레르기 ─────────────────────────────────────────────────

async def create_allergy(db: AsyncSession, user_id: int, data: dict) -> Allergy:
    allergy = Allergy(
        user_id=user_id,
        allergen_name=data["allergen_name"],
        allergen_type=data.get("allergen_type"),
        severity=data.get("severity"),
        reaction_description=data.get("reaction_description")
    )
    db.add(allergy)
    await db.commit()
    await db.refresh(allergy)
    return allergy


async def get_allergies(db: AsyncSession, user_id: int) -> list[Allergy]:
    result = await db.execute(
        select(Allergy).where(Allergy.user_id == user_id)
    )
    return result.scalars().all()


async def delete_allergy(db: AsyncSession, user_id: int, allergy_id: int):
    result = await db.execute(
        select(Allergy).where(
            Allergy.id == allergy_id,
            Allergy.user_id == user_id
        )
    )
    allergy = result.scalar_one_or_none()
    if not allergy:
        raise HTTPException(status_code=404, detail="알레르기를 찾을 수 없습니다")
    await db.delete(allergy)
    await db.commit()


# ─── 건강 프로필 ──────────────────────────────────────────────

async def upsert_health_profile(db: AsyncSession, user_id: int, data: dict) -> HealthProfile:
    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    if profile:
        for key, value in data.items():
            setattr(profile, key, value)
    else:
        profile = HealthProfile(user_id=user_id, **data)
        db.add(profile)

    await db.commit()
    await db.refresh(profile)
    return profile


async def get_health_profile(db: AsyncSession, user_id: int) -> HealthProfile | None:
    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


# ─── 전체 프로필 조회 ─────────────────────────────────────────

async def get_full_profile(db: AsyncSession, user: User) -> dict:
    conditions = await get_conditions(db, user.id)
    medications = await get_medications(db, user.id)
    allergies = await get_allergies(db, user.id)
    health = await get_health_profile(db, user.id)

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        },
        "conditions": conditions,
        "medications": medications,
        "allergies": allergies,
        "health_profile": health
    }
