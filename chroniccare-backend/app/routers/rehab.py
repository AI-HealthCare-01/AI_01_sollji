from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional
from pydantic import BaseModel
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.rehab import RehabPlan, RehabExercise, ExerciseCompletion, ExerciseLibrary

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────

class CompleteExerciseRequest(BaseModel):
    actual_sets: Optional[int] = None
    actual_reps: Optional[int] = None
    pain_level: Optional[int] = None
    notes: Optional[str] = None

class ToggleRequest(BaseModel):
    date: Optional[date] = None

# ── 1. 내 재활 플랜 목록 ──────────────────────────────────

@router.get("/plans")
async def get_my_rehab_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RehabPlan)
        .where(RehabPlan.user_id == current_user.id)
        .order_by(RehabPlan.created_at.desc())
    )
    plans = result.scalars().all()

    return {
        "plans": [
            {
                "id": p.id,
                "target_area": p.target_area,
                "duration_weeks": p.duration_weeks,
                "precautions": p.precautions,
                "is_active": p.is_active,
                "created_at": p.created_at,
            }
            for p in plans
        ]
    }


# ── 2. 플랜 상세 (운동 목록 포함) ────────────────────────

@router.get("/plans/{plan_id}")
async def get_rehab_plan_detail(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RehabPlan)
        .options(
            selectinload(RehabPlan.exercises).selectinload(RehabExercise.exercise)
        )
        .where(RehabPlan.id == plan_id, RehabPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="재활 플랜을 찾을 수 없습니다.")

    exercises = []
    for ex in plan.exercises:
        lib = ex.exercise
        exercises.append({
            "rehab_exercise_id": ex.id,
            "week_number": ex.week_number,
            "sequence_order": ex.sequence_order,
            "sets": ex.sets,
            "reps": ex.reps,
            "duration_seconds": ex.duration_seconds,
            "frequency_per_day": ex.frequency_per_day,
            "special_notes": ex.special_notes,
            "exercise": {
                "exercise_id": lib.exercise_id,
                "exercise_name": lib.exercise_name,
                "category": lib.category,
                "difficulty_level": lib.difficulty_level,
                "instructions": lib.instructions,
                "contraindications": lib.contraindications,
                "video_url": lib.video_url,
                "thumbnail_url": lib.thumbnail_url,
                "tags": lib.tags,
            } if lib else None
        })

    return {
        "id": plan.id,
        "target_area": plan.target_area,
        "duration_weeks": plan.duration_weeks,
        "precautions": plan.precautions,
        "is_active": plan.is_active,
        "created_at": plan.created_at,
        "exercises": exercises
    }


# ── 3. 운동 완료 토글 ─────────────────────────────────────

@router.post("/plans/{plan_id}/exercises/{rehab_exercise_id}/complete")
async def toggle_exercise_complete(
        plan_id: int,
        rehab_exercise_id: int,
        body: ToggleRequest = ToggleRequest(),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    target_date = body.date or date.today()  # ← 프론트에서 받은 날짜 사용

    result = await db.execute(
        select(ExerciseCompletion).where(
            and_(
                ExerciseCompletion.rehab_exercise_id == rehab_exercise_id,
                ExerciseCompletion.user_id == current_user.id,
                ExerciseCompletion.completed_date == target_date  # ← 수정
            )
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return {"status": "cancelled", "date": str(target_date)}
    else:
        completion = ExerciseCompletion(
            user_id=current_user.id,
            rehab_exercise_id=rehab_exercise_id,
            rehab_plan_id=plan_id,
            completed_date=target_date  # ← 수정
        )
        db.add(completion)
        await db.commit()
        return {"status": "completed", "date": str(target_date)}


# ── 4. 날짜별 진행률 조회 ─────────────────────────────────

@router.get("/plans/{plan_id}/progress")
async def get_plan_progress(
    plan_id: int,
    target_date: date = date.today(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    total_result = await db.execute(
        select(func.count(RehabExercise.id)).where(
            RehabExercise.rehab_plan_id == plan_id
        )
    )
    total = total_result.scalar() or 0

    completed_result = await db.execute(
        select(func.count(func.distinct(ExerciseCompletion.rehab_exercise_id))).where(
            and_(
                ExerciseCompletion.rehab_plan_id == plan_id,
                ExerciseCompletion.user_id == current_user.id,
                ExerciseCompletion.completed_date == target_date
            )
        )
    )
    completed = completed_result.scalar() or 0

    completed_ids_result = await db.execute(
        select(ExerciseCompletion.rehab_exercise_id).where(
            and_(
                ExerciseCompletion.rehab_plan_id == plan_id,
                ExerciseCompletion.user_id == current_user.id,
                ExerciseCompletion.completed_date == target_date
            )
        )
    )
    completed_ids = [row[0] for row in completed_ids_result.fetchall()]

    return {
        "date": str(target_date),
        "total_exercises": total,
        "completed_exercises": completed,
        "progress_percent": round(completed / total * 100) if total > 0 else 0,
        "completed_exercise_ids": completed_ids
    }


# ── 5. 재활 플랜 삭제 ────────────────────────

@router.delete("/plans/{plan_id}")
async def delete_rehab_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RehabPlan).where(
            RehabPlan.id == plan_id,
            RehabPlan.user_id == current_user.id
        )
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="재활 플랜을 찾을 수 없습니다.")

    await db.delete(plan)
    await db.commit()
    return {"message": "재활 플랜이 삭제되었습니다.", "plan_id": plan_id}


# ── 6. 운동 라이브러리 목록 ───────────────────────────────

@router.get("/exercises")
async def get_exercise_library(
    category: Optional[str] = Query(None, description="카테고리 필터"),
    difficulty: Optional[str] = Query(None, description="난이도 필터"),
    db: AsyncSession = Depends(get_db)
):
    query = select(ExerciseLibrary)

    if category:
        query = query.where(ExerciseLibrary.category == category)
    if difficulty:
        query = query.where(ExerciseLibrary.difficulty_level == difficulty)

    result = await db.execute(query.order_by(ExerciseLibrary.exercise_id))
    exercises = result.scalars().all()

    return {
        "total": len(exercises),
        "exercises": [
            {
                "exercise_id": e.exercise_id,
                "exercise_name": e.exercise_name,
                "category": e.category,
                "difficulty_level": e.difficulty_level,
                "instructions": e.instructions,
                "contraindications": e.contraindications,
                "video_url": e.video_url,
                "thumbnail_url": e.thumbnail_url,
                "tags": e.tags,
            }
            for e in exercises
        ]
    }
