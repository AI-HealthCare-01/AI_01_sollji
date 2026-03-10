import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from openai import AsyncOpenAI
import time
import logging

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    # 환자/진료 정보
    patient_name: str = ""
    birth_date: str = ""
    age: int = 0
    gender: str = ""
    diagnosis: str = ""
    hospital_name: str = ""
    doctor_name: str = ""
    visit_date: str = ""
    # 기존 분석 필드
    summary: str = ""
    medication_guide: str = ""
    lifestyle_guide: str = ""
    warning_signs: str = ""
    overall_safety_score: int = 0


def _to_str(value) -> str:
    if isinstance(value, list):
        return "\n".join(str(v) for v in value)
    return str(value) if value else ""


class AnalysisServiceBase(ABC):
    @abstractmethod
    # 💡 current_symptom 파라미터가 추가되었습니다.
    async def analyze_text(self, text: str, user_profile: str = "", current_symptom: str = "") -> AnalysisResult:
        pass


# ─────────────────────────────────────────
# Mock (개발/테스트용)
# ─────────────────────────────────────────
class MockAnalysisService(AnalysisServiceBase):
    # 💡 current_symptom 파라미터가 추가되었습니다.
    async def analyze_text(self, text: str, user_profile: str = "", current_symptom: str = "") -> AnalysisResult:
        return AnalysisResult(
            patient_name="홍길동",
            birth_date="1985-03-15",
            age=41,
            gender="남성",
            diagnosis="급성 편도염 (J03.9)",
            hospital_name="한강내과의원",
            doctor_name="이재원",
            visit_date="2026-02-27",
            summary="처방전 분석 완료. 총 3종의 약물이 확인되었습니다.",
            medication_guide=(
                "1. 아목시실린 500mg - 1일 3회, 5일분 (항생제, 식후 복용)\n"
                "2. 이부프로펜 400mg - 1일 2회, 3일분 (소염진통제, 공복 금지)\n"
                "3. 판토프라졸 40mg - 1일 1회, 7일분 (위장약, 식전 복용)"
            ),
            lifestyle_guide="- 충분한 수분 섭취를 권장합니다.\n- 항생제 복용 중 음주는 삼가세요.",
            warning_signs="페니실린 알레르기가 있는 경우 즉시 복용을 중단하고 의사에게 문의하세요.",
            overall_safety_score=0,
        )


# ─────────────────────────────────────────
# OpenAI (실제 연동)
# ─────────────────────────────────────────
# 프롬프트
SYSTEM_PROMPT = """
당신은 최고 수준의 전문성을 갖춘 약사이자 의료 데이터 분석 AI입니다.
사용자가 제공하는 처방전 OCR 텍스트와 [환자 건강 프로필], [현재 내원 사유]를 종합적으로 분석하여 반드시 아래 JSON 형식으로만 응답하세요.
다른 텍스트는 절대 포함하지 마세요. 정보가 없으면 빈 문자열("")로 반환하세요.

[필수 준수 규칙]
1. 병원명 추출 (hospital_name): 반드시 '의료기관 명칭' 란에 있는 이름을 추출하세요. 맨 아래의 '조제기관의 명칭(약국)'과 절대 혼동하지 마세요.
2. 약품명 및 성분명 정확도: '처방 의약품의 명칭'에 적힌 글자를 100% 동일하게 추출하세요. 용량(예: 75밀리그램)과 괄호 안의 성분명(예: 클로피도그렐황산염)을 절대 누락하지 마세요.
3. 투약 정보 상세화 (medication_guide): '1회 투약량', '1일 투여 횟수', '총 투약일수'를 각각 정확히 추출하여 "약품명(성분명) - 1회 O정, 1일 O회, 총 O일분" 형태로 명시하세요.
4. 질병 코드 분석 (diagnosis): '질병분류기호' 란에 코드(예: I219)가 있다면, 해당 코드가 의미하는 질환명(예: 급성 심근경색)을 파악하여 진단명에 반드시 포함하세요.
5. 날짜 기준 (visit_date): '교부 연월일'을 기준으로 작성하며, '조제 연월일'과 혼동하지 마세요.
6. 환자 주의사항 (warning_signs): 추출된 약물들의 주요 부작용(예: 출혈 위험 등)을 바탕으로 환자가 일상에서 주의해야 할 점을 강력히 경고하세요.

{
  "patient_name": "<환자 이름>",
  "birth_date": "<생년월일, YYYY-MM-DD 형식>",
  "age": <나이, 정수. 없으면 0>,
  "gender": "<성별: 남성 또는 여성>",
  "diagnosis": "<진단명 또는 상병명 (질병분류기호 포함)>",
  "hospital_name": "<병원명 (약국 제외)>",
  "doctor_name": "<의사명>",
  "visit_date": "<진료일, YYYY-MM-DD 형식>",
  "summary": "<처방전 전체 요약. 가독성을 위해 2~3문장 단위로 줄바꿈(\\n)을 하세요.>",
  "medication_guide": "<각 약물별 복용법. 반드시 '약품명(성분명) - 1회 O정, 1일 O회, 총 O일분' 형식으로 줄바꿈(\\n)을 하여 목록 형태로 작성하세요.>",
  "lifestyle_guide": "<맞춤형 권고사항 및 재활 가이드. 가독성을 위해 항목별로 글머리 기호(-)를 달고 줄바꿈(\\n)을 하세요.>",
  "warning_signs": "<위험성 경고. 여러 증상일 경우 줄바꿈(\\n)을 통해 읽기 쉽게 작성하세요.>"
}
"""


class OpenAIAnalysisService(AnalysisServiceBase):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    # 💡 current_symptom 파라미터가 추가되었습니다.
    async def analyze_text(self, text: str, user_profile: str = "", current_symptom: str = "") -> AnalysisResult:
        start = time.time()

        user_content = f"[처방전 텍스트]\n{text}"

        # 1. 기저질환 프로필 추가
        if user_profile:
            user_content += f"\n\n[환자 건강 프로필]\n{user_profile}"

        # 2. 새로 추가된 현재 증상/수술명 추가
        if current_symptom:
            user_content += f"\n\n[현재 내원 사유 / 수술명]\n{current_symptom}"

        # 3. AI 지시사항 동적 생성
        if user_profile or current_symptom:
            user_content += (
                "\n\n위 환자의 건강 상태(기저질환)와 내원 사유(수술/증상)를 반드시 종합적으로 고려하세요.\n"
                "1. 처방약과의 상호작용 및 부작용 위험성을 'warning_signs'에 강력히 경고하세요.\n"
                "2. 환자의 현재 증상(수술/질환)에 맞는 '안전한 맞춤형 재활 운동 및 생활 가이드'를 'lifestyle_guide'에 상세히 작성하세요."
            )
        else:
            user_content += "\n\n위 처방전 텍스트를 분석하여 JSON으로 반환해주세요."

        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )

        latency_ms = int((time.time() - start) * 1000)
        usage = response.usage
        logger.info(
            f"[LLM] analysis | latency={latency_ms}ms | "
            f"prompt_tokens={usage.prompt_tokens} | "
            f"completion_tokens={usage.completion_tokens} | "
            f"total_tokens={usage.total_tokens}"
        )

        raw = response.choices[0].message.content
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            cleaned = re.sub(r"```json|```", "", raw).strip()
            data = json.loads(cleaned)

        return AnalysisResult(
            patient_name=_to_str(data.get("patient_name", "")),
            birth_date=_to_str(data.get("birth_date", "")),
            age=int(data.get("age", 0)),
            gender=_to_str(data.get("gender", "")),
            diagnosis=_to_str(data.get("diagnosis", "")),
            hospital_name=_to_str(data.get("hospital_name", "")),
            doctor_name=_to_str(data.get("doctor_name", "")),
            visit_date=_to_str(data.get("visit_date", "")),
            summary=_to_str(data.get("summary", "")),
            medication_guide=_to_str(data.get("medication_guide", "")),
            lifestyle_guide=_to_str(data.get("lifestyle_guide", "")),
            warning_signs=_to_str(data.get("warning_signs", "")),
            overall_safety_score=0,
        )


def get_analysis_service() -> AnalysisServiceBase:
    from app.core.config import get_settings
    settings = get_settings()
    use_mock = getattr(settings, "use_mock_analysis", True)
    if use_mock:
        return MockAnalysisService()
    return OpenAIAnalysisService(api_key=settings.openai_api_key)
