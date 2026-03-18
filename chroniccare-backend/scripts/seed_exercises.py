import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.core.config import get_settings
from app.models.rehab import ExerciseLibrary

settings = get_settings()
engine = create_async_engine(settings.database_url)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

exercises = [
    # ────────────────────────────────────────
    # 무릎
    # ────────────────────────────────────────
    {"exercise_id": "knee01", "exercise_name": "쿼드세팅", "category": "무릎", "difficulty_level": "초급",
     "instructions": "1. 바닥에 다리를 펴고 눕습니다. 2. 허벅지 앞쪽 근육에 힘을 주어 무릎을 바닥에 누릅니다. 3. 5초간 유지 후 천천히 힘을 뺍니다.",
     "contraindications": [], "tags": ["무릎", "급성기", "근력"]},

    {"exercise_id": "knee02", "exercise_name": "SLR(하지직거상)", "category": "무릎", "difficulty_level": "초급",
     "instructions": "1. 바닥에 등을 대고 눕습니다. 2. 한쪽 무릎은 세우고 반대쪽 다리는 펩니다. 3. 편 다리를 45도까지 천천히 들어 올립니다. 4. 5초 유지 후 천천히 내립니다.",
     "contraindications": [], "tags": ["무릎", "근력"]},

    {"exercise_id": "knee03", "exercise_name": "발목펌핑", "category": "무릎", "difficulty_level": "초급",
     "instructions": "1. 다리를 편 자세로 눕거나 앉습니다. 2. 발목을 위쪽(발등 방향)으로 당겼다가 아래쪽으로 내립니다. 3. 리드미컬하게 반복하여 혈액순환을 촉진합니다.",
     "contraindications": [], "tags": ["무릎", "급성기", "순환"]},

    {"exercise_id": "knee04", "exercise_name": "앉아서 무릎 펴기", "category": "무릎", "difficulty_level": "초급",
     "instructions": "1. 의자에 바르게 앉습니다. 2. 한쪽 다리를 천천히 들어 무릎을 완전히 폅니다. 3. 2초 유지 후 천천히 내립니다. 4. 반대쪽도 반복합니다.",
     "contraindications": [], "tags": ["무릎", "가동범위"]},

    {"exercise_id": "knee05", "exercise_name": "미니스쿼트", "category": "무릎", "difficulty_level": "중급",
     "instructions": "1. 발을 어깨너비로 벌리고 섭니다. 2. 등을 곧게 펴고 무릎을 30도 정도 천천히 굽힙니다. 3. 무릎이 발끝을 넘지 않도록 주의합니다. 4. 천천히 일어섭니다.",
     "contraindications": ["급성 골절"], "tags": ["무릎", "근력"]},

    {"exercise_id": "knee06", "exercise_name": "스텝업", "category": "무릎", "difficulty_level": "중급",
     "instructions": "1. 낮은 계단 또는 스텝 박스 앞에 섭니다. 2. 한 발을 계단 위에 올립니다. 3. 올린 발에 체중을 실어 천천히 올라갑니다. 4. 천천히 내려옵니다.",
     "contraindications": ["급성 골절"], "tags": ["무릎", "기능"]},

    {"exercise_id": "knee07", "exercise_name": "옆으로 다리 들기", "category": "무릎", "difficulty_level": "초급",
     "instructions": "1. 옆으로 눕습니다. 2. 위쪽 다리를 곧게 펴고 30도 높이로 천천히 들어 올립니다. 3. 2초 유지 후 천천히 내립니다. 4. 반대쪽도 반복합니다.",
     "contraindications": [], "tags": ["무릎", "고관절"]},

    {"exercise_id": "knee08", "exercise_name": "무릎 굽히기", "category": "무릎", "difficulty_level": "초급",
     "instructions": "1. 엎드려 눕습니다. 2. 한쪽 무릎을 천천히 굽혀 발뒤꿈치를 엉덩이 쪽으로 당깁니다. 3. 가능한 범위까지만 굽히고 통증이 없는 범위를 유지합니다. 4. 천천히 내립니다.",
     "contraindications": [], "tags": ["무릎", "가동범위"]},

    {"exercise_id": "knee09", "exercise_name": "터미널 무릎 신전", "category": "무릎", "difficulty_level": "중급",
     "instructions": "1. 탄성 밴드를 무릎 뒤쪽에 걸고 고정합니다. 2. 무릎을 약간 굽힌 상태에서 시작합니다. 3. 밴드 저항을 이기며 무릎을 완전히 펍니다. 4. 천천히 원위치로 돌아옵니다.",
     "contraindications": [], "tags": ["무릎", "근력"]},

    {"exercise_id": "knee10", "exercise_name": "레그프레스", "category": "무릎", "difficulty_level": "고급",
     "instructions": "1. 레그프레스 머신에 앉아 발을 플레이트에 올립니다. 2. 무릎을 90도로 굽힌 상태에서 시작합니다. 3. 발로 플레이트를 밀어 무릎을 천천히 폅니다. 4. 완전히 펴지 않고 약간 굽힌 상태에서 멈춥니다.",
     "contraindications": ["급성 골절", "수술 직후"], "tags": ["무릎", "근력"]},

    {"exercise_id": "knee11", "exercise_name": "클램쉘", "category": "무릎", "difficulty_level": "초급",
     "instructions": "1. 옆으로 누워 무릎을 45도 굽힙니다. 2. 발을 붙인 채로 위쪽 무릎을 조개처럼 천천히 벌립니다. 3. 골반이 뒤로 넘어가지 않도록 주의합니다. 4. 천천히 원위치로 돌아옵니다.",
     "contraindications": [], "tags": ["무릎", "고관절", "중둔근"]},

    {"exercise_id": "knee12", "exercise_name": "힙 어브덕션 (서서)", "category": "무릎", "difficulty_level": "초급",
     "instructions": "1. 벽이나 의자를 잡고 섭니다. 2. 한쪽 다리를 옆으로 천천히 들어 올립니다. 3. 골반이 기울지 않도록 유지합니다. 4. 천천히 내립니다.",
     "contraindications": [], "tags": ["무릎", "고관절", "중둔근"]},

    {"exercise_id": "knee13", "exercise_name": "월 슬라이드", "category": "무릎", "difficulty_level": "중급",
     "instructions": "1. 등을 벽에 기대고 섭니다. 2. 발을 벽에서 약간 앞으로 내딛습니다. 3. 등을 벽에 붙인 채 무릎을 45~60도 굽힙니다. 4. 10초 유지 후 천천히 일어섭니다.",
     "contraindications": ["급성 골절"], "tags": ["무릎", "근력", "대퇴사두"]},

    {"exercise_id": "knee14", "exercise_name": "햄스트링 스트레칭", "category": "무릎", "difficulty_level": "초급",
     "instructions": "1. 바닥에 앉아 다리를 앞으로 뻗습니다. 2. 등을 곧게 펴고 상체를 천천히 앞으로 숙입니다. 3. 허벅지 뒤쪽이 당기는 느낌에서 20~30초 유지합니다. 4. 통증이 오면 즉시 멈춥니다.",
     "contraindications": [], "tags": ["무릎", "햄스트링", "유연성"]},

    {"exercise_id": "knee15", "exercise_name": "대퇴사두 스트레칭", "category": "무릎", "difficulty_level": "초급",
     "instructions": "1. 서서 한쪽 발목을 뒤로 잡습니다. 2. 무릎을 모아 허벅지 앞쪽이 당기도록 합니다. 3. 균형이 어려우면 벽을 잡습니다. 4. 20~30초 유지합니다.",
     "contraindications": [], "tags": ["무릎", "대퇴사두", "유연성"]},

    # ────────────────────────────────────────
    # 허리
    # ────────────────────────────────────────
    {"exercise_id": "back01", "exercise_name": "무릎 가슴 당기기", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 바닥에 등을 대고 눕습니다. 2. 양 무릎을 가슴 쪽으로 천천히 당깁니다. 3. 허리가 바닥에서 떨어지지 않도록 합니다. 4. 10~20초 유지 후 천천히 내립니다.",
     "contraindications": [], "tags": ["허리", "스트레칭"]},

    {"exercise_id": "back02", "exercise_name": "골반 기울이기", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 바닥에 무릎을 세우고 눕습니다. 2. 배꼽을 당기듯 허리를 바닥에 납작하게 붙입니다. 3. 5초 유지 후 힘을 뺍니다. 4. 허리 아치가 사라지는 느낌을 확인합니다.",
     "contraindications": [], "tags": ["허리", "급성기", "코어"]},

    {"exercise_id": "back03", "exercise_name": "브릿지", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 바닥에 무릎을 세우고 눕습니다. 2. 발바닥으로 바닥을 밀며 엉덩이를 들어 올립니다. 3. 어깨-엉덩이-무릎이 일직선이 되도록 합니다. 4. 5초 유지 후 천천히 내립니다.",
     "contraindications": [], "tags": ["허리", "코어", "둔근"]},

    {"exercise_id": "back04", "exercise_name": "고양이-낙타 스트레칭", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 네발 자세(손과 무릎)를 취합니다. 2. 숨을 내쉬며 등을 천장 쪽으로 둥글게 올립니다(고양이). 3. 숨을 들이쉬며 배를 바닥 쪽으로 내리고 허리를 젖힙니다(낙타). 4. 리드미컬하게 반복합니다.",
     "contraindications": [], "tags": ["허리", "유연성", "가동범위"]},

    {"exercise_id": "back05", "exercise_name": "버드독", "category": "허리", "difficulty_level": "중급",
     "instructions": "1. 네발 자세를 취하고 척추를 중립으로 유지합니다. 2. 오른팔과 왼쪽 다리를 동시에 수평으로 들어 올립니다. 3. 허리가 흔들리지 않도록 코어에 힘을 줍니다. 4. 5초 유지 후 반대쪽을 반복합니다.",
     "contraindications": [], "tags": ["허리", "코어", "균형"]},

    {"exercise_id": "back06", "exercise_name": "슈퍼맨", "category": "허리", "difficulty_level": "중급",
     "instructions": "1. 엎드려 팔을 앞으로 뻗습니다. 2. 팔과 다리를 동시에 바닥에서 들어 올립니다. 3. 3초 유지 후 천천히 내립니다. 4. 목은 중립을 유지하고 위를 보지 않습니다.",
     "contraindications": ["급성 요통"], "tags": ["허리", "근력", "척추기립근"]},

    {"exercise_id": "back07", "exercise_name": "앉아서 허리 돌리기", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 의자에 바르게 앉아 발을 바닥에 붙입니다. 2. 양손을 가슴 앞에 교차합니다. 3. 상체를 천천히 좌우로 돌립니다. 4. 골반은 고정하고 흉추만 회전합니다.",
     "contraindications": [], "tags": ["허리", "가동범위", "흉추"]},

    {"exercise_id": "back08", "exercise_name": "맥켄지 신전", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 엎드려 손을 어깨 옆에 놓습니다. 2. 팔꿈치를 짚고 상체를 천천히 들어 올립니다. 3. 허리가 편안하게 신전되는 느낌을 확인합니다. 4. 10초 유지 후 천천히 내립니다.",
     "contraindications": ["척추관협착증"], "tags": ["허리", "신전", "디스크"]},

    {"exercise_id": "back09", "exercise_name": "데드버그", "category": "허리", "difficulty_level": "중급",
     "instructions": "1. 바닥에 누워 팔을 천장 쪽으로 뻗고 무릎을 90도로 듭니다. 2. 허리를 바닥에 붙인 채 오른팔과 왼쪽 다리를 동시에 내립니다. 3. 허리가 뜨지 않도록 코어에 힘을 유지합니다. 4. 원위치 후 반대쪽을 반복합니다.",
     "contraindications": [], "tags": ["허리", "코어", "안정화"]},

    {"exercise_id": "back10", "exercise_name": "플랭크", "category": "허리", "difficulty_level": "고급",
     "instructions": "1. 팔꿈치를 바닥에 짚고 엎드립니다. 2. 발끝으로 몸을 지탱하며 몸을 일직선으로 만듭니다. 3. 엉덩이가 올라가거나 처지지 않도록 합니다. 4. 20~30초 유지합니다.",
     "contraindications": ["급성 요통", "수술 직후"], "tags": ["허리", "코어", "전신"]},

    {"exercise_id": "back11", "exercise_name": "고관절 굴곡근 스트레칭", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 한쪽 무릎을 바닥에 대고 런지 자세를 취합니다. 2. 앞쪽 발에 체중을 실으며 골반을 앞으로 밀어냅니다. 3. 뒤쪽 허벅지 앞쪽이 당기는 느낌에서 20~30초 유지합니다. 4. 허리가 과도하게 젖히지 않도록 주의합니다.",
     "contraindications": [], "tags": ["허리", "고관절", "장요근", "디스크"]},

    {"exercise_id": "back12", "exercise_name": "흉추 회전 스트레칭", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 옆으로 누워 무릎을 90도로 굽힙니다. 2. 위쪽 팔을 천장 방향으로 들어 올리며 상체를 뒤로 회전합니다. 3. 어깨가 바닥에 닿는 느낌으로 천천히 돌립니다. 4. 20~30초 유지 후 반대쪽도 반복합니다.",
     "contraindications": [], "tags": ["허리", "흉추", "가동성", "디스크"]},

    {"exercise_id": "back13", "exercise_name": "힙 힌지", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 발을 어깨너비로 벌리고 섭니다. 2. 무릎을 약간 굽히고 엉덩이를 뒤로 밀며 상체를 앞으로 기울입니다. 3. 등은 곧게 유지하고 허리를 굽히지 않습니다. 4. 엉덩이 근육을 조이며 원위치로 돌아옵니다.",
     "contraindications": [], "tags": ["허리", "고관절", "둔근", "패턴"]},

    {"exercise_id": "back14", "exercise_name": "사이드 플랭크 (무릎 지지)", "category": "허리", "difficulty_level": "중급",
     "instructions": "1. 옆으로 누워 팔꿈치와 무릎으로 몸을 지탱합니다. 2. 엉덩이를 들어 올려 몸을 일직선으로 만듭니다. 3. 옆구리 근육에 힘을 줍니다. 4. 20초 유지 후 반대쪽도 반복합니다.",
     "contraindications": ["급성 요통"], "tags": ["허리", "코어", "측면"]},

    {"exercise_id": "back15", "exercise_name": "글루트 브릿지 (한 다리)", "category": "허리", "difficulty_level": "중급",
     "instructions": "1. 바닥에 무릎을 세우고 눕습니다. 2. 한쪽 다리를 펴서 들어 올립니다. 3. 바닥에 닿은 발로 밀며 엉덩이를 들어 올립니다. 4. 골반이 기울지 않도록 유지합니다.",
     "contraindications": ["급성 요통"], "tags": ["허리", "둔근", "코어", "고관절"]},

    {"exercise_id": "back16", "exercise_name": "이상근 스트레칭", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 바닥에 누워 한쪽 무릎을 세웁니다. 2. 반대쪽 발목을 세운 무릎 위에 올립니다. 3. 세운 무릎을 가슴 쪽으로 당깁니다. 4. 엉덩이 깊숙한 곳이 당기는 느낌에서 20~30초 유지합니다.",
     "contraindications": [], "tags": ["허리", "이상근", "고관절", "좌골신경"]},

    {"exercise_id": "back17", "exercise_name": "흉추 신전 (폼롤러)", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 폼롤러를 등 중간(흉추)에 놓고 눕습니다. 2. 양손을 머리 뒤에 받칩니다. 3. 폼롤러 위에서 상체를 천천히 뒤로 젖힙니다. 4. 흉추가 이완되는 느낌에서 10~15초 유지합니다.",
     "contraindications": ["골다공증 심각"], "tags": ["허리", "흉추", "가동성"]},

    {"exercise_id": "back18", "exercise_name": "복식 호흡 (코어 활성화)", "category": "허리", "difficulty_level": "초급",
     "instructions": "1. 편안하게 눕거나 앉습니다. 2. 한 손을 배 위에 올립니다. 3. 코로 숨을 들이쉬며 배를 부풀립니다. 4. 입으로 천천히 내쉬며 배꼽을 척추 쪽으로 당깁니다. 5. 이 과정에서 횡격막과 심부 코어가 활성화됩니다.",
     "contraindications": [], "tags": ["허리", "코어", "호흡", "급성기", "디스크"]},

    # ────────────────────────────────────────
    # 어깨
    # ────────────────────────────────────────
    {"exercise_id": "shoulder01", "exercise_name": "진자 운동", "category": "어깨", "difficulty_level": "초급",
     "instructions": "1. 테이블에 한 손을 짚고 앞으로 숙입니다. 2. 반대쪽 팔을 자연스럽게 늘어뜨립니다. 3. 몸을 약간 흔들어 팔이 추처럼 앞뒤, 좌우로 움직이게 합니다. 4. 근육의 힘이 아닌 중력을 이용합니다.",
     "contraindications": [], "tags": ["어깨", "급성기", "가동범위"]},

    {"exercise_id": "shoulder02", "exercise_name": "어깨 으쓱하기", "category": "어깨", "difficulty_level": "초급",
     "instructions": "1. 편안하게 앉거나 섭니다. 2. 양 어깨를 귀 쪽으로 천천히 올립니다. 3. 2초 유지 후 천천히 내립니다. 4. 목에 힘이 들어가지 않도록 주의합니다.",
     "contraindications": [], "tags": ["어깨", "승모근", "급성기"]},

    {"exercise_id": "shoulder03", "exercise_name": "벽 기어오르기", "category": "어깨", "difficulty_level": "초급",
     "instructions": "1. 벽 앞에 서서 손가락 끝을 벽에 댑니다. 2. 손가락을 이용해 벽을 타고 천천히 위로 올라갑니다. 3. 통증이 없는 범위까지만 올립니다. 4. 천천히 내려옵니다.",
     "contraindications": [], "tags": ["어깨", "가동범위", "굴곡"]},

    {"exercise_id": "shoulder04", "exercise_name": "어깨 외회전 운동", "category": "어깨", "difficulty_level": "중급",
     "instructions": "1. 팔꿈치를 90도로 굽히고 옆구리에 붙입니다. 2. 탄성 밴드를 손에 쥐고 고정합니다. 3. 팔꿈치를 고정한 채 손을 바깥쪽으로 돌립니다. 4. 천천히 원위치로 돌아옵니다.",
     "contraindications": [], "tags": ["어깨", "회전근개", "외회전"]},

    {"exercise_id": "shoulder05", "exercise_name": "덤벨 측면 들기", "category": "어깨", "difficulty_level": "중급",
     "instructions": "1. 가벼운 덤벨(0.5~1kg)을 양손에 듭니다. 2. 팔꿈치를 약간 굽힌 채 팔을 옆으로 들어 올립니다. 3. 어깨 높이까지만 올립니다. 4. 천천히 내립니다.",
     "contraindications": ["급성 손상"], "tags": ["어깨", "근력", "삼각근"]},

    {"exercise_id": "shoulder06", "exercise_name": "어깨 내회전 운동", "category": "어깨", "difficulty_level": "중급",
     "instructions": "1. 팔꿈치를 90도로 굽히고 옆구리에 붙입니다. 2. 탄성 밴드를 손에 쥐고 고정합니다. 3. 팔꿈치를 고정한 채 손을 배 쪽으로 돌립니다. 4. 천천히 원위치로 돌아옵니다.",
     "contraindications": [], "tags": ["어깨", "회전근개", "내회전"]},

    {"exercise_id": "shoulder07", "exercise_name": "어깨 굴곡 운동 (앞으로 들기)", "category": "어깨", "difficulty_level": "초급",
     "instructions": "1. 팔을 몸 옆에 자연스럽게 늘어뜨립니다. 2. 엄지손가락이 위를 향하도록 하여 팔을 앞으로 천천히 들어 올립니다. 3. 통증이 없는 범위까지만 올립니다. 4. 천천히 내립니다.",
     "contraindications": [], "tags": ["어깨", "가동범위", "굴곡"]},

    {"exercise_id": "shoulder08", "exercise_name": "어깨 수평 내전 스트레칭", "category": "어깨", "difficulty_level": "초급",
     "instructions": "1. 한쪽 팔을 가슴 앞으로 뻗습니다. 2. 반대쪽 팔로 뻗은 팔의 팔꿈치를 가슴 쪽으로 당깁니다. 3. 어깨 뒤쪽이 당기는 느낌에서 20~30초 유지합니다. 4. 반대쪽도 반복합니다.",
     "contraindications": [], "tags": ["어깨", "후면삼각근", "스트레칭"]},

    {"exercise_id": "shoulder09", "exercise_name": "밴드 풀 어파트", "category": "어깨", "difficulty_level": "중급",
     "instructions": "1. 탄성 밴드를 양손으로 잡고 앞으로 뻗습니다. 2. 양팔을 옆으로 벌려 밴드를 가슴 앞에서 당깁니다. 3. 어깨뼈를 모으는 느낌으로 당깁니다. 4. 천천히 원위치로 돌아옵니다.",
     "contraindications": ["급성 손상"], "tags": ["어깨", "후면삼각근", "견갑골"]},

    {"exercise_id": "shoulder10", "exercise_name": "목 옆으로 기울이기 스트레칭", "category": "어깨", "difficulty_level": "초급",
     "instructions": "1. 바르게 앉아 한손을 의자 아래에 고정합니다. 2. 반대쪽으로 귀를 어깨 쪽으로 천천히 기울입니다. 3. 목 옆쪽이 당기는 느낌에서 20~30초 유지합니다. 4. 반대쪽도 반복합니다.",
     "contraindications": [], "tags": ["어깨", "목", "승모근", "스트레칭"]},

    {"exercise_id": "shoulder11", "exercise_name": "견갑골 안정화 운동", "category": "어깨", "difficulty_level": "초급",
     "instructions": "1. 바르게 앉거나 섭니다. 2. 어깨를 뒤로 당기며 어깨뼈를 모읍니다. 3. 동시에 어깨를 아래로 내립니다. 4. 5초 유지 후 천천히 이완합니다.",
     "contraindications": [], "tags": ["어깨", "견갑골", "자세", "안정화"]},

    {"exercise_id": "shoulder12", "exercise_name": "팔꿈치 굴곡/신전 (ROM)", "category": "어깨", "difficulty_level": "초급",
     "instructions": "1. 팔을 자연스럽게 내립니다. 2. 팔꿈치를 천천히 굽혀 손이 어깨에 닿도록 합니다. 3. 천천히 다시 펍니다. 4. 어깨 수술 후 팔꿈치 가동범위 유지에 도움이 됩니다.",
     "contraindications": [], "tags": ["어깨", "팔꿈치", "가동범위", "급성기"]},

    # ────────────────────────────────────────
    # 손목
    # ────────────────────────────────────────
    {"exercise_id": "wrist01", "exercise_name": "손목 굽히기/펴기", "category": "손목", "difficulty_level": "초급",
     "instructions": "1. 팔꿈치를 테이블에 올리고 손목을 테이블 밖으로 내밉니다. 2. 손목을 천천히 위로 굽힙니다(배측굴곡). 3. 천천히 아래로 내립니다(장측굴곡). 4. 통증이 없는 범위에서 반복합니다.",
     "contraindications": [], "tags": ["손목", "가동범위", "굴곡신전"]},

    {"exercise_id": "wrist02", "exercise_name": "손목 돌리기", "category": "손목", "difficulty_level": "초급",
     "instructions": "1. 팔꿈치를 고정하고 손목을 자연스럽게 내립니다. 2. 손목을 시계방향으로 천천히 크게 돌립니다. 3. 반시계방향으로도 반복합니다. 4. 통증이 있는 범위는 피합니다.",
     "contraindications": [], "tags": ["손목", "유연성", "가동범위"]},

    {"exercise_id": "wrist03", "exercise_name": "손가락 굽히기/펴기", "category": "손목", "difficulty_level": "초급",
     "instructions": "1. 손을 자연스럽게 앞으로 뻗습니다. 2. 손가락을 천천히 주먹 쥐듯 굽힙니다. 3. 천천히 손가락을 완전히 폅니다. 4. 리드미컬하게 반복하여 혈액순환을 촉진합니다.",
     "contraindications": [], "tags": ["손목", "급성기", "순환", "손가락"]},

    {"exercise_id": "wrist04", "exercise_name": "손목 저항 운동", "category": "손목", "difficulty_level": "중급",
     "instructions": "1. 팔꿈치를 테이블에 올리고 손목을 내밉니다. 2. 반대 손으로 손등을 가볍게 누릅니다. 3. 저항을 이기며 손목을 위로 굽힙니다. 4. 천천히 내립니다. 반대 방향도 반복합니다.",
     "contraindications": ["급성 골절"], "tags": ["손목", "근력", "저항"]},

    {"exercise_id": "wrist05", "exercise_name": "악력 강화 운동", "category": "손목", "difficulty_level": "중급",
     "instructions": "1. 소프트볼이나 수건을 손에 쥡니다. 2. 최대한 세게 쥐어짭니다. 3. 5초 유지 후 천천히 힘을 뺍니다. 4. 손가락 전체를 고르게 사용합니다.",
     "contraindications": ["급성 골절"], "tags": ["손목", "근력", "악력"]},

    {"exercise_id": "wrist06", "exercise_name": "전완 회내/회외 운동", "category": "손목", "difficulty_level": "초급",
     "instructions": "1. 팔꿈치를 90도로 굽히고 옆구리에 붙입니다. 2. 손바닥이 위를 향하도록 돌립니다(회외). 3. 손바닥이 아래를 향하도록 돌립니다(회내). 4. 천천히 반복합니다.",
     "contraindications": [], "tags": ["손목", "전완", "가동범위", "회전"]},

    {"exercise_id": "wrist07", "exercise_name": "손목 요측/척측 편위", "category": "손목", "difficulty_level": "초급",
     "instructions": "1. 팔꿈치를 테이블에 올리고 손목을 중립으로 유지합니다. 2. 손목을 엄지 방향으로 기울입니다(요측편위). 3. 새끼손가락 방향으로 기울입니다(척측편위). 4. 천천히 반복합니다.",
     "contraindications": [], "tags": ["손목", "가동범위", "측면"]},

    {"exercise_id": "wrist08", "exercise_name": "팔꿈치 굴곡/신전", "category": "손목", "difficulty_level": "초급",
     "instructions": "1. 팔을 자연스럽게 내립니다. 2. 팔꿈치를 천천히 굽혀 손이 어깨에 닿도록 합니다. 3. 천천히 다시 완전히 폅니다. 4. 손목 골절 후 팔꿈치 가동범위 유지에 중요합니다.",
     "contraindications": [], "tags": ["손목", "팔꿈치", "가동범위", "연계"]},

    {"exercise_id": "wrist09", "exercise_name": "손목 신근 스트레칭", "category": "손목", "difficulty_level": "초급",
     "instructions": "1. 팔을 앞으로 뻗고 손바닥이 아래를 향하게 합니다. 2. 반대 손으로 손등을 아래로 천천히 누릅니다. 3. 팔 뒤쪽이 당기는 느낌에서 20~30초 유지합니다. 4. 반대쪽도 반복합니다.",
     "contraindications": ["급성 골절"], "tags": ["손목", "스트레칭", "신근"]},

    {"exercise_id": "wrist10", "exercise_name": "손목 굴근 스트레칭", "category": "손목", "difficulty_level": "초급",
     "instructions": "1. 팔을 앞으로 뻗고 손바닥이 위를 향하게 합니다. 2. 반대 손으로 손가락을 아래로 천천히 당깁니다. 3. 팔 안쪽이 당기는 느낌에서 20~30초 유지합니다. 4. 반대쪽도 반복합니다.",
     "contraindications": ["급성 골절"], "tags": ["손목", "스트레칭", "굴근"]},

    {"exercise_id": "wrist11", "exercise_name": "손가락 개별 운동", "category": "손목", "difficulty_level": "초급",
     "instructions": "1. 손을 테이블 위에 올립니다. 2. 엄지부터 새끼손가락까지 하나씩 들어 올립니다. 3. 각 손가락을 2초 유지 후 내립니다. 4. 손가락 독립적 조절 능력을 회복합니다.",
     "contraindications": [], "tags": ["손목", "손가락", "세밀운동", "급성기"]},

    {"exercise_id": "wrist12", "exercise_name": "테니스 엘보 스트레칭", "category": "손목", "difficulty_level": "초급",
     "instructions": "1. 팔을 앞으로 뻗고 주먹을 가볍게 쥡니다. 2. 손목을 아래로 굽힙니다. 3. 반대 손으로 주먹을 아래로 천천히 당깁니다. 4. 팔꿈치 바깥쪽이 당기는 느낌에서 20~30초 유지합니다.",
     "contraindications": ["급성 골절"], "tags": ["손목", "팔꿈치", "외상과", "스트레칭"]},

    # ────────────────────────────────────────
    # 고관절
    # ────────────────────────────────────────
    {"exercise_id": "hip01", "exercise_name": "누워서 고관절 굴곡", "category": "고관절", "difficulty_level": "초급",
     "instructions": "1. 바닥에 등을 대고 눕습니다. 2. 한쪽 무릎을 가슴 쪽으로 천천히 당깁니다. 3. 양손으로 무릎 아래를 잡아 보조합니다. 4. 20초 유지 후 천천히 내립니다.",
     "contraindications": [], "tags": ["고관절", "굴곡", "가동범위"]},

    {"exercise_id": "hip02", "exercise_name": "고관절 신전 (엎드려)", "category": "고관절", "difficulty_level": "초급",
     "instructions": "1. 엎드려 눕습니다. 2. 한쪽 다리를 곧게 펴고 바닥에서 10~15cm 들어 올립니다. 3. 엉덩이 근육에 힘이 들어오는 것을 확인합니다. 4. 3초 유지 후 천천히 내립니다.",
     "contraindications": [], "tags": ["고관절", "신전", "둔근"]},

    {"exercise_id": "hip03", "exercise_name": "고관절 외전 (누워서)", "category": "고관절", "difficulty_level": "초급",
     "instructions": "1. 바닥에 등을 대고 눕습니다. 2. 한쪽 다리를 곧게 펴고 옆으로 천천히 벌립니다. 3. 골반이 기울지 않도록 유지합니다. 4. 천천히 원위치로 돌아옵니다.",
     "contraindications": [], "tags": ["고관절", "외전", "중둔근"]},

    {"exercise_id": "hip04", "exercise_name": "나비 스트레칭", "category": "고관절", "difficulty_level": "초급",
     "instructions": "1. 바닥에 앉아 양 발바닥을 마주 붙입니다. 2. 발꿈치를 몸 쪽으로 당깁니다. 3. 양 무릎을 바닥 쪽으로 천천히 내립니다. 4. 사타구니 안쪽이 당기는 느낌에서 20~30초 유지합니다.",
     "contraindications": [], "tags": ["고관절", "내전근", "유연성"]},

    {"exercise_id": "hip05", "exercise_name": "90/90 스트레칭", "category": "고관절", "difficulty_level": "초급",
     "instructions": "1. 바닥에 앉아 한쪽 다리는 앞에, 반대쪽 다리는 옆에 90도로 놓습니다. 2. 앞쪽 다리 방향으로 상체를 천천히 숙입니다. 3. 엉덩이 바깥쪽이 당기는 느낌에서 20~30초 유지합니다. 4. 반대쪽도 반복합니다.",
     "contraindications": [], "tags": ["고관절", "외회전", "이상근"]},

    {"exercise_id": "hip06", "exercise_name": "고관절 굴곡근 강화", "category": "고관절", "difficulty_level": "중급",
     "instructions": "1. 의자에 바르게 앉습니다. 2. 한쪽 무릎을 천천히 들어 올립니다. 3. 허벅지가 의자와 수평이 될 때까지 올립니다. 4. 3초 유지 후 천천히 내립니다.",
     "contraindications": [], "tags": ["고관절", "굴곡근", "장요근", "근력"]},

    {"exercise_id": "hip07", "exercise_name": "사이드 스텝 (탄성 밴드)", "category": "고관절", "difficulty_level": "중급",
     "instructions": "1. 발목에 탄성 밴드를 묶습니다. 2. 무릎을 약간 굽히고 옆으로 한 발씩 이동합니다. 3. 발을 모으지 않고 밴드 장력을 유지합니다. 4. 좌우 각 10회 반복합니다.",
     "contraindications": [], "tags": ["고관절", "중둔근", "기능", "밴드"]},

    {"exercise_id": "hip08", "exercise_name": "스쿼트 (고관절 힌지 강조)", "category": "고관절", "difficulty_level": "중급",
     "instructions": "1. 발을 어깨너비보다 약간 넓게 벌립니다. 2. 엉덩이를 뒤로 빼며 천천히 앉습니다. 3. 무릎이 발끝 방향을 향하도록 합니다. 4. 엉덩이 근육을 조이며 천천히 일어섭니다.",
     "contraindications": ["급성 골절", "수술 직후"], "tags": ["고관절", "둔근", "근력", "기능"]},

    # ────────────────────────────────────────
    # 발목
    # ────────────────────────────────────────
    {"exercise_id": "ankle01", "exercise_name": "발목 배측굴곡/저측굴곡", "category": "발목", "difficulty_level": "초급",
     "instructions": "1. 다리를 펴고 앉거나 눕습니다. 2. 발을 몸 쪽으로 당깁니다(배측굴곡). 3. 발을 아래로 뻗습니다(저측굴곡). 4. 천천히 반복합니다.",
     "contraindications": [], "tags": ["발목", "가동범위", "급성기"]},

    {"exercise_id": "ankle02", "exercise_name": "발목 내번/외번", "category": "발목", "difficulty_level": "초급",
     "instructions": "1. 다리를 펴고 앉습니다. 2. 발을 안쪽으로 돌립니다(내번). 3. 발을 바깥쪽으로 돌립니다(외번). 4. 천천히 반복합니다.",
     "contraindications": [], "tags": ["발목", "가동범위", "안정성"]},

    {"exercise_id": "ankle03", "exercise_name": "발목 원 그리기", "category": "발목", "difficulty_level": "초급",
     "instructions": "1. 다리를 펴고 앉거나 눕습니다. 2. 발목을 시계방향으로 크게 원을 그립니다. 3. 반시계방향으로도 반복합니다. 4. 최대 가동범위를 부드럽게 움직입니다.",
     "contraindications": [], "tags": ["발목", "가동범위", "유연성"]},

    {"exercise_id": "ankle04", "exercise_name": "까치발 들기", "category": "발목", "difficulty_level": "초급",
     "instructions": "1. 벽이나 의자를 잡고 섭니다. 2. 발뒤꿈치를 천천히 들어 올립니다. 3. 2초 유지 후 천천히 내립니다. 4. 종아리 근육이 수축하는 것을 확인합니다.",
     "contraindications": ["급성 골절"], "tags": ["발목", "종아리", "근력"]},

    {"exercise_id": "ankle05", "exercise_name": "한 발 균형 잡기", "category": "발목", "difficulty_level": "중급",
     "instructions": "1. 벽 옆에 서서 한 발로 섭니다. 2. 처음에는 벽을 가볍게 짚고 균형을 잡습니다. 3. 익숙해지면 손을 떼고 균형을 유지합니다. 4. 20~30초 유지합니다.",
     "contraindications": ["급성 골절"], "tags": ["발목", "균형", "고유감각"]},

    {"exercise_id": "ankle06", "exercise_name": "발목 탄성 밴드 저항 운동", "category": "발목", "difficulty_level": "중급",
     "instructions": "1. 탄성 밴드를 발에 걸고 고정합니다. 2. 밴드 저항을 이기며 발을 배측굴곡합니다. 3. 천천히 원위치로 돌아옵니다. 4. 방향을 바꿔 내번/외번도 반복합니다.",
     "contraindications": ["급성 골절"], "tags": ["발목", "근력", "밴드"]},

    # ────────────────────────────────────────
    # 목
    # ────────────────────────────────────────
    {"exercise_id": "neck01", "exercise_name": "목 굴곡/신전", "category": "목", "difficulty_level": "초급",
     "instructions": "1. 바르게 앉습니다. 2. 턱을 가슴 쪽으로 천천히 당깁니다(굴곡). 3. 천천히 원위치로 돌아옵니다. 4. 목을 뒤로 젖힙니다(신전). 5. 통증이 없는 범위에서만 움직입니다.",
     "contraindications": ["경추 골절", "경추 수술 직후"], "tags": ["목", "가동범위", "굴곡신전"]},

    {"exercise_id": "neck02", "exercise_name": "목 측면 굴곡", "category": "목", "difficulty_level": "초급",
     "instructions": "1. 바르게 앉습니다. 2. 귀를 어깨 쪽으로 천천히 기울입니다. 3. 반대쪽 목이 당기는 느낌에서 10초 유지합니다. 4. 반대쪽도 반복합니다.",
     "contraindications": ["경추 골절"], "tags": ["목", "가동범위", "측면"]},

    {"exercise_id": "neck03", "exercise_name": "목 회전", "category": "목", "difficulty_level": "초급",
     "instructions": "1. 바르게 앉습니다. 2. 턱을 수평으로 유지하며 고개를 천천히 좌우로 돌립니다. 3. 통증이 없는 범위까지만 돌립니다. 4. 각 방향에서 5초 유지합니다.",
     "contraindications": ["경추 골절"], "tags": ["목", "가동범위", "회전"]},

    {"exercise_id": "neck04", "exercise_name": "턱 당기기 (Chin Tuck)", "category": "목", "difficulty_level": "초급",
     "instructions": "1. 바르게 앉거나 눕습니다. 2. 턱을 뒤로 당겨 이중턱을 만드는 느낌으로 합니다. 3. 목 뒤쪽이 늘어나는 느낌을 확인합니다. 4. 5초 유지 후 이완합니다.",
     "contraindications": [], "tags": ["목", "자세", "심부굴곡근", "디스크"]},

    {"exercise_id": "neck05", "exercise_name": "목 등척성 저항 운동", "category": "목", "difficulty_level": "중급",
     "instructions": "1. 바르게 앉습니다. 2. 손바닥을 이마에 대고 머리로 손을 밀어냅니다. 3. 손은 움직이지 않고 저항만 줍니다. 4. 5초 유지 후 이완합니다. 5. 옆면, 뒷면도 같은 방법으로 반복합니다.",
     "contraindications": ["경추 골절", "경추 수술 직후"], "tags": ["목", "근력", "등척성"]},
]


async def seed():
    async with AsyncSessionLocal() as session:
        for data in exercises:
            from sqlalchemy import select
            existing = await session.execute(
                select(ExerciseLibrary).where(ExerciseLibrary.exercise_id == data["exercise_id"])
            )
            if existing.scalar_one_or_none():
                print(f"⏭️  {data['exercise_id']} 이미 존재, 스킵")
                continue
            exercise = ExerciseLibrary(**data)
            session.add(exercise)
        await session.commit()
        print(f"✅ 운동 데이터 {len(exercises)}개 삽입 완료!")


if __name__ == "__main__":
    asyncio.run(seed())
