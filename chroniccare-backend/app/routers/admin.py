from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.analysis import GuideResult
from app.models.chat import ChatMessage, ChatSession
from app.models.rehab import RehabPlan
from app.models.user import HealthProfile, User


router = APIRouter()
settings = get_settings()


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not settings.admin_email or current_user.email != settings.admin_email:
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    return current_user


@router.get("/overview", summary="관리자 읽기 전용 운영 현황")
async def get_admin_overview(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    total_users = await db.scalar(select(func.count()).select_from(User)) or 0
    users_with_profiles = await db.scalar(select(func.count()).select_from(HealthProfile)) or 0
    total_guides = await db.scalar(select(func.count()).select_from(GuideResult)) or 0
    completed_guides = (
        await db.scalar(select(func.count()).select_from(GuideResult).where(GuideResult.status == "completed"))
        or 0
    )
    active_rehab_plans = (
        await db.scalar(select(func.count()).select_from(RehabPlan).where(RehabPlan.is_active.is_(True))) or 0
    )
    total_chat_sessions = await db.scalar(select(func.count()).select_from(ChatSession)) or 0
    total_chat_messages = await db.scalar(select(func.count()).select_from(ChatMessage)) or 0

    guide_count_sq = (
        select(GuideResult.user_id, func.count(GuideResult.id).label("guide_count"))
        .group_by(GuideResult.user_id)
        .subquery()
    )
    completed_guide_count_sq = (
        select(GuideResult.user_id, func.count(GuideResult.id).label("completed_guide_count"))
        .where(GuideResult.status == "completed")
        .group_by(GuideResult.user_id)
        .subquery()
    )
    last_analysis_sq = (
        select(GuideResult.user_id, func.max(GuideResult.generated_at).label("last_analysis_at"))
        .group_by(GuideResult.user_id)
        .subquery()
    )
    active_rehab_count_sq = (
        select(RehabPlan.user_id, func.count(RehabPlan.id).label("active_rehab_plan_count"))
        .where(RehabPlan.is_active.is_(True))
        .group_by(RehabPlan.user_id)
        .subquery()
    )
    chat_session_count_sq = (
        select(ChatSession.user_id, func.count(ChatSession.id).label("chat_session_count"))
        .group_by(ChatSession.user_id)
        .subquery()
    )

    users_result = await db.execute(
        select(
            User.id,
            User.email,
            User.name,
            User.created_at,
            HealthProfile.id.label("health_profile_id"),
            func.coalesce(guide_count_sq.c.guide_count, 0).label("guide_count"),
            func.coalesce(completed_guide_count_sq.c.completed_guide_count, 0).label("completed_guide_count"),
            func.coalesce(active_rehab_count_sq.c.active_rehab_plan_count, 0).label("active_rehab_plan_count"),
            func.coalesce(chat_session_count_sq.c.chat_session_count, 0).label("chat_session_count"),
            last_analysis_sq.c.last_analysis_at,
        )
        .outerjoin(HealthProfile, HealthProfile.user_id == User.id)
        .outerjoin(guide_count_sq, guide_count_sq.c.user_id == User.id)
        .outerjoin(completed_guide_count_sq, completed_guide_count_sq.c.user_id == User.id)
        .outerjoin(active_rehab_count_sq, active_rehab_count_sq.c.user_id == User.id)
        .outerjoin(chat_session_count_sq, chat_session_count_sq.c.user_id == User.id)
        .outerjoin(last_analysis_sq, last_analysis_sq.c.user_id == User.id)
        .order_by(User.created_at.desc())
    )

    users = [
        {
            "id": row.id,
            "email": row.email,
            "name": row.name,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "has_health_profile": row.health_profile_id is not None,
            "guide_count": int(row.guide_count or 0),
            "completed_guide_count": int(row.completed_guide_count or 0),
            "active_rehab_plan_count": int(row.active_rehab_plan_count or 0),
            "chat_session_count": int(row.chat_session_count or 0),
            "last_analysis_at": row.last_analysis_at.isoformat() if row.last_analysis_at else None,
        }
        for row in users_result.all()
    ]

    recent_guides_result = await db.execute(
        select(
            GuideResult.id,
            GuideResult.user_id,
            User.email,
            GuideResult.patient_name,
            GuideResult.diagnosis,
            GuideResult.status,
            GuideResult.generated_at,
        )
        .join(User, User.id == GuideResult.user_id)
        .order_by(GuideResult.generated_at.desc())
        .limit(10)
    )

    recent_guides = [
        {
            "guide_result_id": row.id,
            "user_id": row.user_id,
            "user_email": row.email,
            "patient_name": row.patient_name,
            "diagnosis": row.diagnosis,
            "status": row.status,
            "created_at": row.generated_at.isoformat() if row.generated_at else None,
        }
        for row in recent_guides_result.all()
    ]

    return {
        "summary": {
            "total_users": int(total_users),
            "users_with_profiles": int(users_with_profiles),
            "total_guides": int(total_guides),
            "completed_guides": int(completed_guides),
            "active_rehab_plans": int(active_rehab_plans),
            "total_chat_sessions": int(total_chat_sessions),
            "total_chat_messages": int(total_chat_messages),
            "admin_email": settings.admin_email,
            "generated_at": datetime.utcnow().isoformat(),
        },
        "users": users,
        "recent_guides": recent_guides,
    }
