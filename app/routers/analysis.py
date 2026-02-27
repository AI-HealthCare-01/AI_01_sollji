from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document, OCRResult
from app.models.analysis import GuideResult
from app.services.analysis_service import get_analysis_service
from app.models.rehab import RehabPlan, RehabExercise
from app.services.rehab_service import get_rehab_service

router = APIRouter()


# ─────────────────────────────────────────
# 백그라운드에서 실행될 실제 분석 함수
# ─────────────────────────────────────────
async def run_analysis_background(
    guide_result_id: int,
    ocr_raw_text: str,
    user_id: int,
):
    """
    이 함수는 백그라운드에서 실행돼요.
    클라이언트는 이미 응답을 받은 상태고,
    여기서 LLM 분석 + 재활 플랜 생성이 조용히 진행됩니다.
    """
    # 백그라운드 작업은 새로운 DB 세션이 필요해요
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            # 1. 분석 실행
            service = get_analysis_service()
            result = await service.analyze_text(ocr_raw_text)

            # 2. GuideResult 업데이트 (분석 결과 저장)
            guide = await db.get(GuideResult, guide_result_id)
            guide.status = "completed"
            guide.overall_safety_score = result.overall_safety_score
            guide.summary = result.summary
            guide.medication_guide = result.medication_guide
            guide.lifestyle_guide = result.lifestyle_guide
            guide.warning_signs = result.warning_signs
            await db.commit()
            await db.refresh(guide)

            # 3. 재활 플랜 자동 생성
            try:
                rehab_service = get_rehab_service()
                rehab_result = await rehab_service.generate_rehab_plan(
                    analysis_summary=f"{result.summary}\n{result.medication_guide}"
                )

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

            except Exception:
                # 재활 플랜 실패해도 분석 결과는 유지
                await db.rollback()

        except Exception as e:
            # 분석 자체가 실패한 경우 → status를 "failed"로 업데이트
            async with AsyncSessionLocal() as error_db:
                guide = await error_db.get(GuideResult, guide_result_id)
                if guide:
                    guide.status = "failed"
                    guide.error_message = str(e)
                    await error_db.commit()


# ─────────────────────────────────────────
# POST /{document_id} — 분석 요청 (즉시 응답)
# ─────────────────────────────────────────
@router.post("/{document_id}", summary="처방전 AI 분석 요청")
async def analyze_document(
    document_id: int,
    background_tasks: BackgroundTasks,   # ← 추가된 부분
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Document 소유권 확인
    doc_result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
    )
    document = doc_result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    # 2. OCRResult 조회
    ocr_row = await db.execute(
        select(OCRResult).where(OCRResult.document_id == document_id)
    )
    ocr_result = ocr_row.scalar_one_or_none()
    if not ocr_result:
        raise HTTPException(
            status_code=404,
            detail="OCR 결과가 없습니다. 먼저 /upload로 이미지를 업로드해주세요."
        )

    # 3. GuideResult를 status="processing"으로 먼저 생성
    guide = GuideResult(
        user_id=current_user.id,
        ocr_result_id=ocr_result.id,
        status="processing",   # ← 일단 processing으로 저장
    )
    db.add(guide)
    await db.commit()
    await db.refresh(guide)

    # 4. 실제 분석은 백그라운드에 등록 (클라이언트는 기다리지 않아도 됨)
    background_tasks.add_task(
        run_analysis_background,
        guide_result_id=guide.id,
        ocr_raw_text=ocr_result.raw_text,
        user_id=current_user.id,
    )

    # 5. 즉시 응답 (분석은 백그라운드에서 진행 중)
    return {
        "guide_result_id": guide.id,
        "status": "processing",
        "message": "분석이 시작되었습니다. /analysis/{guide_result_id}/status 로 진행 상황을 확인하세요."
    }


# ─────────────────────────────────────────
# GET /{guide_result_id}/status — 상태 조회
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
        # 아직 분석 중
        return {
            "guide_result_id": guide_result_id,
            "status": "processing",
            "message": "분석 중입니다. 잠시 후 다시 확인해주세요."
        }

    elif guide.status == "failed":
        # 분석 실패
        return {
            "guide_result_id": guide_result_id,
            "status": "failed",
            "error": guide.error_message
        }

    else:
        # 분석 완료 → 전체 결과 반환
        return {
            "guide_result_id": guide_result_id,
            "status": "completed",
            "overall_safety_score": guide.overall_safety_score,
            "summary": guide.summary,
            "medication_guide": guide.medication_guide,
            "lifestyle_guide": guide.lifestyle_guide,
            "warning_signs": guide.warning_signs,
        }
