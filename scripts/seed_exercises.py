import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.models.rehab import ExerciseLibrary

settings = get_settings()

engine = create_async_engine(settings.database_url)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

exercises = [
    {"exercise_id": "ex001", "exercise_name": "무릎 굽히기", "category": "하체", "difficulty_level": "초급", "description": "의자에 앉아 무릎을 천천히 굽혔다 펴기"},
    {"exercise_id": "ex002", "exercise_name": "어깨 돌리기", "category": "상체", "difficulty_level": "초급", "description": "양 어깨를 앞뒤로 천천히 돌리기"},
    {"exercise_id": "ex003", "exercise_name": "발목 스트레칭", "category": "하체", "difficulty_level": "초급", "description": "발목을 시계방향, 반시계방향으로 돌리기"},
    {"exercise_id": "ex004", "exercise_name": "벽 푸시업", "category": "상체", "difficulty_level": "중급", "description": "벽에 손을 짚고 팔굽혀펴기"},
    {"exercise_id": "ex005", "exercise_name": "누워서 다리 들기", "category": "하체", "difficulty_level": "중급", "description": "누운 자세에서 다리를 45도로 들어 올리기"},
    {"exercise_id": "ex006", "exercise_name": "목 스트레칭", "category": "목", "difficulty_level": "초급", "description": "목을 좌우, 앞뒤로 천천히 스트레칭"},
    {"exercise_id": "ex007", "exercise_name": "고관절 스트레칭", "category": "하체", "difficulty_level": "중급", "description": "앉아서 한쪽 다리를 교차해 고관절 늘리기"},
    {"exercise_id": "ex008", "exercise_name": "호흡 운동", "category": "전신", "difficulty_level": "초급", "description": "복식호흡으로 폐활량 늘리기"},
]

async def seed():
    async with AsyncSessionLocal() as session:
        for data in exercises:
            exercise = ExerciseLibrary(**data)
            session.add(exercise)
        await session.commit()
        print(f"✅ {len(exercises)}개 운동 데이터 삽입 완료!")

if __name__ == "__main__":
    asyncio.run(seed())
