from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional
import logging
import asyncio

from app.core.database import get_db, AsyncSessionLocal
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document, OCRResult
from app.models.analysis import GuideResult, DrugInteraction, MedicationSchedule
from app.models.rehab import RehabPlan, RehabExercise
from app.services.analysis_service import get_analysis_service
from app.services.drug_normalizer import normalize_drug_names, apply_normalization
from app.services.rehab_service import get_rehab_service

router = APIRouter()
logger = logging.getLogger(__name__)


class AnalyzeRequest(BaseModel):
    current_symptom: Optional[str] = ""


# ─────────────────────────────────────────
# 백그라운드에서 실행될 실제 분석 함수
# ─────────────────────────────────────────
async def run_analysis_background(
        guide_result_id: int,
        ocr_raw_text: str,
        user_id: int,
        current_symptom: str = "",
):
    async with AsyncSessionLocal() as db:
        try:
            # 1. 유저의 건강 프로필 끌어오기
            result_user = await db.execute(
                select(User)
                .options(
                    selectinload(User.health_profile),
                    selectinload(User.chronic_conditions),
                    selectinload(User.allergies),
                    selectinload(User.medications)
                )
                .where(User.id == user_id)
            )
            user = result_user.scalar_one_or_none()

            # 2. 프로필 문자열 구성
            profile_info = ""
            if user:
                if user.health_profile:
                    profile_info += f"- 신체: {user.health_profile.height}cm, {user.health_profile.weight}kg\n"
                    profile_info += f"- 흡연여부: {user.health_profile.smoking_status}, 음주빈도: {user.health_profile.alcohol_frequency}\n"
                if user.chronic_conditions:
                    conditions = [c.condition_type for c in user.chronic_conditions]
                    profile_info += f"- 기저질환: {', '.join(conditions)}\n"
                if user.allergies:
                    allergies = [f"{a.allergen_name} ({a.reaction_description})" for a in user.allergies]
                    profile_info += f"- 알레르기: {', '.join(allergies)}\n"
                if user.medications:
                    meds = [m.medication_name for m in user.medications if m.is_active]
                    if meds:
                        profile_info += f"- 현재 복용중인 약: {', '.join(meds)}\n"

            # 3. ① 분석 LLM 먼저 실행 (rehab에 결과 필요하므로 순차)
            service = get_analysis_service()
            result = await service.analyze_text(
                text=ocr_raw_text,
                user_profile=profile_info,
                current_symptom=current_symptom,
            )

            # 4. ② normalize + rehab 병렬 실행 ─────────────────────
            from app.core.config import get_settings
            settings = get_settings()

            # normalize용 약물명 수집
            drug_names = []
            for item in result.drug_interactions:
                if item.get("medication_a"):
                    drug_names.append(item["medication_a"])
                if item.get("medication_b"):
                    drug_names.append(item["medication_b"])
            for schedule in result.medication_schedules:
                sd = schedule.get("schedule_date", {})
                if sd.get("drug_name"):
                    drug_names.append(sd["drug_name"])

            # rehab용 요약 텍스트
            rehab_summary = f"{result.summary}\n{result.diagnosis}\n{result.medication_guide}"

            # 병렬 실행
            async def run_normalize():
                if drug_names and not getattr(settings, "use_mock_analysis", False):
                    return await normalize_drug_names(
                        drug_names=drug_names,
                        api_key=settings.openai_api_key,
                    )
                return {}

            async def run_rehab():
                rehab_service = get_rehab_service()
                return await rehab_service.generate_rehab_plan(
                    analysis_summary=rehab_summary
                )

            normalize_result, rehab_result = await asyncio.gather(
                run_normalize(),
                run_rehab(),
                return_exceptions=True,  # 하나 실패해도 다른 쪽 결과 살림
            )
            # ────────────────────────────────────────────────────────

            # 5. normalize 결과 적용
            if isinstance(normalize_result, Exception):
                logger.warning(f"[약물 표준화 실패] guide_id={guide_result_id} — 원본 유지: {normalize_result}")
            elif normalize_result:
                result.medication_guide, result.drug_interactions, result.medication_schedules = (
                    apply_normalization(
                        medication_guide=result.medication_guide,
                        drug_interactions=result.drug_interactions,
                        medication_schedules=result.medication_schedules,
                        mapping=normalize_result,
                    )
                )
                logger.info(f"[약물 표준화 완료] guide_id={guide_result_id} | 대상={len(drug_names)}개")

            # 6. GuideResult 업데이트
            guide = await db.get(GuideResult, guide_result_id)
            guide.status = "completed"
            guide.overall_safety_score = result.overall_safety_score
            guide.patient_name = result.patient_name
            guide.birth_date = result.birth_date
            guide.age = result.age
            guide.gender = result.gender
            guide.diagnosis = result.diagnosis
            guide.hospital_name = result.hospital_name
            guide.doctor_name = result.doctor_name
            guide.visit_date = result.visit_date
            guide.summary = result.summary
            guide.medication_guide = result.medication_guide
            guide.lifestyle_guide = result.lifestyle_guide
            guide.warning_signs = result.warning_signs
            await db.commit()
            await db.refresh(guide)

            # 6-1. DrugInteraction 저장
            if result.drug_interactions:
                for item in result.drug_interactions:
                    interaction = DrugInteraction(
                        guide_result_id=guide_result_id,
                        medication_a=item.get("medication_a", ""),
                        medication_b=item.get("medication_b", ""),
                        interaction_type=item.get("interaction_type", ""),
                        severity=item.get("severity", ""),
                        mechanism=item.get("mechanism", ""),
                        recommendation=item.get("recommendation", ""),
                    )
                    db.add(interaction)

            # 6-2. MedicationSchedule 저장
            if result.medication_schedules:
                for item in result.medication_schedules:
                    sd = item.get("schedule_date", {})
                    schedule = MedicationSchedule(
                        guide_result_id=guide_result_id,
                        user_id=user_id,
                        schedule_date={
                            "drug_name": sd.get("drug_name", ""),
                            "times": sd.get("times", []),
                            "with_food": sd.get("with_food", False),
                            "duration_days": sd.get("duration_days", 0),
                        },
                    )
                    db.add(schedule)

            await db.commit()
            logger.info(
                f"[분석 완료] guide_id={guide.id} | "
                f"interactions={len(result.drug_interactions)} | "
                f"schedules={len(result.medication_schedules)}"
            )

            # 7. 재활 플랜 저장
            if isinstance(rehab_result, Exception):
                logger.error(f"[재활 플랜 생성 실패] guide_result_id={guide_result_id}, error={rehab_result}")
            else:
                existing_plans_result = await db.execute(
                    select(RehabPlan).where(
                        RehabPlan.user_id == user_id,
                        RehabPlan.is_active == True,
                    )
                )
                existing_plans = existing_plans_result.scalars().all()
                for old_plan in existing_plans:
                    old_plan.is_active = False
                await db.flush()

                rehab_plan = RehabPlan(
                    user_id=user_id,
                    guide_result_id=guide_result_id,
                    target_area=rehab_result.target_area,
                    duration_weeks=rehab_result.duration_weeks,
                    precautions=rehab_result.precautions,
                    is_active=True,
                )
                db.add(rehab_plan)
                await db.flush()

                for ex_data in rehab_result.exercises:
                    rehab_ex = RehabExercise(
                        rehab_plan_id=rehab_plan.id,
                        exercise_id=ex_data["exercise_id"],
                        week_number=ex_data.get("week_number"),
                        sequence_order=ex_data.get("sequence_order"),
                        sets=ex_data.get("sets"),
                        reps=ex_data.get("reps"),
                        duration_seconds=ex_data.get("duration_seconds"),
                        frequency_per_day=ex_data.get("frequency_per_day"),
                        special_notes=ex_data.get("special_notes"),
                    )
                    db.add(rehab_ex)

                await db.commit()
                logger.info(f"[재활 플랜 생성 완료] user_id={user_id}, area={rehab_result.target_area}")

        except Exception as e:
            async with AsyncSessionLocal() as error_db:
                guide = await error_db.get(GuideResult, guide_result_id)
                if guide:
                    guide.status = "failed"
                    guide.error_message = str(e)
                    await error_db.commit()

# ─────────────────────────────────────────
# POST /{document_id} — 분석 요청
# ─────────────────────────────────────────
@router.post("/{document_id}", summary="처방전 AI 분석 요청")
async def analyze_document(
        document_id: int,
        background_tasks: BackgroundTasks,
        body: AnalyzeRequest = AnalyzeRequest(),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    doc_result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
    )
    document = doc_result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    ocr_row = await db.execute(
        select(OCRResult).where(OCRResult.document_id == document_id)
    )
    ocr_result = ocr_row.scalar_one_or_none()
    if not ocr_result:
        raise HTTPException(
            status_code=404,
            detail="OCR 결과가 없습니다. 먼저 /upload로 이미지를 업로드해주세요."
        )

    guide = GuideResult(
        user_id=current_user.id,
        ocr_result_id=ocr_result.id,
        status="processing",
    )
    db.add(guide)
    await db.commit()
    await db.refresh(guide)

    background_tasks.add_task(
        run_analysis_background,
        guide_result_id=guide.id,
        ocr_raw_text=ocr_result.raw_text,
        user_id=current_user.id,
        current_symptom=body.current_symptom,
    )

    return {
        "guide_result_id": guide.id,
        "status": "processing",
        "message": "AI가 처방전을 분석하고 있습니다. 잠시만 기다려주세요.",
    }


# ─────────────────────────────────────────
# GET /history
# ─────────────────────────────────────────
@router.get("/history", summary="내 분석 이력 조회")
async def get_analysis_history(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(GuideResult)
        .where(GuideResult.user_id == current_user.id)
        .order_by(GuideResult.generated_at.desc())
        .limit(20)
    )
    guides = result.scalars().all()

    return [
        {
            "guide_result_id": g.id,
            "status": g.status,
            "created_at": g.generated_at.isoformat() if g.generated_at else None,
            "patient_name": g.patient_name,
            "diagnosis": g.diagnosis,
            "hospital_name": g.hospital_name,
            "summary": g.summary,
        }
        for g in guides
    ]


# ─────────────────────────────────────────
# GET /{guide_result_id}/status
# ─────────────────────────────────────────
@router.get("/{guide_result_id}/status", summary="분석 진행 상태 조회")
async def get_analysis_status(
        guide_result_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    guide = await db.get(GuideResult, guide_result_id)

    if not guide or guide.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")

    if guide.status == "processing":
        return {
            "guide_result_id": guide_result_id,
            "status": "processing",
            "message": "분석 중입니다. 잠시 후 다시 확인해주세요."
        }
    elif guide.status == "failed":
        return {
            "guide_result_id": guide_result_id,
            "status": "failed",
            "error": guide.error_message
        }
    else:
        interactions_result = await db.execute(
            select(DrugInteraction).where(DrugInteraction.guide_result_id == guide_result_id)
        )
        interactions = interactions_result.scalars().all()

        schedules_result = await db.execute(
            select(MedicationSchedule).where(MedicationSchedule.guide_result_id == guide_result_id)
        )
        schedules = schedules_result.scalars().all()

        return {
            "guide_result_id": guide_result_id,
            "status": "completed",
            "patient_name": guide.patient_name,
            "birth_date": guide.birth_date,
            "age": guide.age,
            "gender": guide.gender,
            "diagnosis": guide.diagnosis,
            "hospital_name": guide.hospital_name,
            "doctor_name": guide.doctor_name,
            "visit_date": guide.visit_date,
            "overall_safety_score": guide.overall_safety_score,
            "summary": guide.summary,
            "medication_guide": guide.medication_guide,
            "lifestyle_guide": guide.lifestyle_guide,
            "warning_signs": guide.warning_signs,
            "drug_interactions": [
                {
                    "medication_a": i.medication_a,
                    "medication_b": i.medication_b,
                    "interaction_type": i.interaction_type,
                    "severity": i.severity,
                    "mechanism": i.mechanism,
                    "recommendation": i.recommendation,
                }
                for i in interactions
            ],
            "medication_schedules": [
                {"schedule_date": s.schedule_date}
                for s in schedules
            ],
        }


# ─────────────────────────────────────────
# DELETE /{guide_result_id}
# ─────────────────────────────────────────
@router.delete("/{guide_result_id}", summary="처방전 분석 결과 삭제")
async def delete_analysis_result(
        guide_result_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    guide = await db.get(GuideResult, guide_result_id)

    if not guide or guide.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없거나 삭제 권한이 없습니다.")

    await db.delete(guide)
    await db.commit()

    return {"message": "처방전 분석 결과가 성공적으로 삭제되었습니다."}
