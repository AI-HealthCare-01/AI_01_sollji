import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import NoReturn
from app.core.config import get_settings

from openai import AsyncOpenAI, APITimeoutError, RateLimitError, APIConnectionError
from fastapi import HTTPException
import time
import logging

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    patient_name: str = ""
    birth_date: str = ""
    age: int = 0
    gender: str = ""
    diagnosis: str = ""
    hospital_name: str = ""
    doctor_name: str = ""
    visit_date: str = ""
    summary: str = ""
    medication_guide: str = ""
    lifestyle_guide: str = ""
    warning_signs: str = ""
    overall_safety_score: int = 0
    drug_interactions: list = field(default_factory=list)
    medication_schedules: list = field(default_factory=list)


def _to_str(value) -> str:
    if isinstance(value, list):
        return "\n".join(str(v) for v in value)
    return str(value) if value else ""


def _raise_llm_error(code: str) -> NoReturn:
    messages = {
        "LLM_001": "AI 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
        "LLM_002": "AI 응답을 처리하는 중 오류가 발생했습니다.",
        "LLM_003": "AI 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
        "LLM_004": "AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
    }
    raise HTTPException(
        status_code=503,
        detail={"code": code, "message": messages.get(code, "AI 분석 중 오류가 발생했습니다.")}
    )


class AnalysisServiceBase(ABC):
    @abstractmethod
    async def analyze_text(self, text: str, user_profile: str = "", current_symptom: str = "") -> AnalysisResult:
        pass


# ─────────────────────────────────────────
# Mock (개발/테스트용)
# ─────────────────────────────────────────
class MockAnalysisService(AnalysisServiceBase):
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
            drug_interactions=[
                {
                    "medication_a": "이부프로펜",
                    "medication_b": "아목시실린",
                    "interaction_type": "흡수 저하",
                    "severity": "low",
                    "mechanism": "이부프로펜이 아목시실린의 신장 배설을 일부 억제할 수 있습니다.",
                    "recommendation": "특별한 조치는 필요 없으나 신기능 이상 시 주의하세요."
                }
            ],
            medication_schedules=[
                {
                    "schedule_date": {
                        "medications": [
                            {"name": "아목시실린 500mg", "times": ["08:00", "13:00", "19:00"], "with_food": True},
                            {"name": "이부프로펜 400mg", "times": ["08:00", "19:00"], "with_food": True},
                            {"name": "판토프라졸 40mg", "times": ["07:30"], "with_food": False}
                        ],
                        "duration_days": 5
                    }
                }
            ],
        )


# ─────────────────────────────────────────
# OpenAI
# ─────────────────────────────────────────
SYSTEM_PROMPT = """
당신은 최고 수준의 전문성을 갖춘 약사이자 의료 데이터 분석 AI입니다.
사용자가 제공하는 처방전 OCR 텍스트와 [환자 건강 프로필], [현재 내원 사유]를 종합적으로 분석하여
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[필수 준수 규칙]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 병원명 (hospital_name):
   - 반드시 '의료기관 명칭' 란의 이름을 추출하세요.
   - 맨 아래 '조제기관의 명칭(약국)'과 절대 혼동하지 마세요.

2. 약품명 정확도:
   - '처방 의약품의 명칭'에 적힌 글자를 100% 동일하게 추출하세요.
   - 용량(예: 37.5mg)과 괄호 안 성분명을 절대 누락하지 마세요.

3. ⚠️ 투약 정보 해석 (가장 중요):
   한국 처방전 표의 열 순서는 반드시 다음과 같습니다:
   [약품명] | [1회 투약량] | [1일 투여횟수] | [총 투약일수] | [용법]

   OCR로 추출된 숫자가 약품명 뒤에 나열될 때:
   - 첫 번째 숫자 = 1회 투약량 (보통 1)
   - 두 번째 숫자 = 1일 투여횟수 (하루에 몇 번)
   - 세 번째 숫자 = 총 투약일수 (며칠치)

   ✅ 올바른 예시:
   "트라마돌염산염정 37.5mg 1 3 5 식후 30분"
   → 1회 1정, 1일 3회, 총 5일분, 식후 30분 복용

   "세파클러캡슐 250mg 1 3 7 식후"
   → 1회 1캡슐, 1일 3회, 총 7일분, 식후 복용

   "란소프라졸캡슐 15mg 1 1 7 아침 식전"
   → 1회 1캡슐, 1일 1회, 총 7일분, 아침 식전 복용

   ❌ 절대 금지:
   - 세 번째 숫자(총 투약일수)를 1일 횟수로 해석하는 것
   - 두 번째 숫자(1일 횟수)를 총 일수로 해석하는 것
   - "식후", "식전" 등 용법 텍스트를 숫자로 카운트하는 것

4. 질병 코드 (diagnosis):
   - '질병분류기호' 코드가 있으면 해당 질환명을 포함하세요.
   - ⚠️ OCR로 인해 코드에 공백이 섞여 있을 수 있습니다.
     반드시 공백을 제거하고 원래 코드로 복원하세요.
     예: "M 5 1 . 1" → "M51.1", "S 5 2 . 5" → "S52.5", "L 4 0" → "L40"
   - 복원한 코드를 절대 다른 코드로 변환하거나 재해석하지 마세요.
     예: "M51.1"을 "M11"로 바꾸는 것 절대 금지
   - [환자 건강 프로필]의 기저질환은 절대 diagnosis에 포함하지 마세요.
   코드 계열:
   - M51.1 → 요추 및 기타 추간판 장애 (추간판 탈출증, 허리디스크)
   - S52x → 전완골(요골/척골) 골절, S525 → 요골 원위부 골절
   - S72x → 대퇴골 골절, S82x → 하퇴골 골절
   - M54.5 → 요통 (S525와 절대 혼동 금지)
   - I219 → 급성 심근경색

5. 날짜 (visit_date):
   - '교부 연월일' 또는 '처방일'을 그대로 추출하세요.
   - '조제 연월일'과 혼동하지 마세요.

6. 약물 상호작용 (drug_interactions):
   - 처방된 약물들 사이의 상호작용을 분석하세요.
   - [환자 건강 프로필]의 현재 복용 중인 약과의 상호작용도 반드시 포함하세요.
   - [환자 건강 프로필]의 알레르기 정보와 처방약의 교차반응도 확인하세요.
     예: 페니실린 알레르기 환자에게 세팔로스포린 계열 처방 → 교차 알레르기 반응 위험 (severity: high)
   - 상호작용이 없으면 빈 배열 []을 반환하세요.
   - severity는 반드시 "high", "medium", "low" 중 하나만 사용하세요.

7. 복약 스케줄 (medication_schedules):
   - 처방된 약물별로 각각 별도의 객체를 생성하세요. (약이 3개면 객체 3개)
   - 절대 하나로 통합하지 마세요.
   - 각 객체 구조:
     {
       "schedule_date": {
         "drug_name": "<약품명>",
         "times": ["HH:MM", ...],
         "with_food": true 또는 false,
         "duration_days": <해당 약의 총 투약일수>
       }
     }
   - times는 24시간 형식(HH:MM)으로 작성하세요.
   - with_food: 식후 복용이면 true, 식전/공복이면 false.
   - duration_days는 해당 약 각각의 총 투약일수를 사용하세요. (가장 긴 것 X)

8. 주의해야 할 증상 (warning_signs):
   - 일반 환자가 읽기 쉬운 자연스러운 한국어 문장으로 작성하세요.
   - "severity: high", "severity: medium" 등의 기술적 표현은 절대 포함하지 마세요.
   - drug_interactions의 내용을 그대로 복사하지 마세요.
   - 실제로 환자가 겪을 수 있는 증상 위주로 작성하세요.

   ✅ 올바른 예시:
   "• 위장 출혈 의심 증상(검은 변, 혈변, 심한 복통)이 나타나면 즉시 복용을 중단하고 응급실을 방문하세요.
   • 근육통이나 황달 증상이 나타나면 즉시 의료진에게 알리세요."

   ❌ 절대 금지:
   - "(severity: high)", "(severity: medium)" 등 기술적 표현 포함
   - drug_interactions 내용 그대로 복붙

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[응답 JSON 형식] — 이 형식 하나만 사용하세요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "patient_name": "<환자 이름>",
  "birth_date": "<생년월일, YYYY-MM-DD 형식으로 변환. 주민번호 앞자리 6자리(YYMMDD)면 YYYY-MM-DD로 변환>",
  "age": <birth_date 기준으로 직접 계산한 만 나이 정수. 절대 추정하지 말고 계산하세요>,
  "gender": "<남성 또는 여성>",
  "diagnosis": "<진단명 (질병분류기호 포함)>",
  "hospital_name": "<병원명 (약국 제외)>",
  "doctor_name": "<의사명>",
  "visit_date": "<진료일, YYYY-MM-DD>",
  "summary": "<처방전 전체 요약, 2~3문장, 줄바꿈 \\n 사용>",
  "medication_guide": "<약품명(성분명) - 1회 O정, 1일 O회, 총 O일분 형식, 줄바꿈 \\n 사용>",
  "lifestyle_guide": "<맞춤형 권고사항, 항목별 - 기호와 줄바꿈 \\n 사용>",
  "warning_signs": "<위험성 경고, 줄바꿈 \\n 사용>",
  "drug_interactions": [
    {
      "medication_a": "<약품명>",
      "medication_b": "<약품명>",
      "interaction_type": "<상호작용 유형>",
      "severity": "high 또는 medium 또는 low",
      "mechanism": "<작용 원리, 1~2문장>",
      "recommendation": "<환자에게 전달할 권고사항>"
    }
  ],
  "medication_schedules": [
    {
      "schedule_date": {
        "drug_name": "<약품명>",
        "times": ["HH:MM"],
        "with_food": true,
        "duration_days": 7
      }
    }
  ]
}
"""


class OpenAIAnalysisService(AnalysisServiceBase):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def analyze_text(self, text: str, user_profile: str = "", current_symptom: str = "") -> AnalysisResult:
        start = time.time()

        user_content = f"[처방전 텍스트]\n{text}"

        if user_profile:
            user_content += f"\n\n[환자 건강 프로필]\n{user_profile}"

        if current_symptom:
            user_content += f"\n\n[현재 내원 사유 / 수술명]\n{current_symptom}"

        if user_profile or current_symptom:
            user_content += (
                "\n\n위 환자의 건강 상태(기저질환)와 내원 사유(수술/증상)를 반드시 종합적으로 고려하세요.\n"
                "1. 처방약과의 상호작용 및 부작용 위험성을 'warning_signs'에 강력히 경고하세요.\n"
                "2. 환자의 현재 증상(수술/질환)에 맞는 '안전한 맞춤형 재활 운동 및 생활 가이드'를 'lifestyle_guide'에 상세히 작성하세요."
            )
        else:
            user_content += "\n\n위 처방전 텍스트를 분석하여 JSON으로 반환해주세요."

        # LLM 호출
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                temperature=0,
                response_format={"type": "json_object"},
            )
        except RateLimitError:
            _raise_llm_error("LLM_003")
        except APITimeoutError:
            _raise_llm_error("LLM_004")
        except APIConnectionError:
            _raise_llm_error("LLM_001")

        latency_ms = int((time.time() - start) * 1000)
        usage = response.usage
        logger.info(
            f"[LLM] analysis | latency={latency_ms}ms | "
            f"prompt_tokens={usage.prompt_tokens} | "
            f"completion_tokens={usage.completion_tokens} | "
            f"total_tokens={usage.total_tokens}"
        )

        raw = response.choices[0].message.content

        # JSON 파싱 — 두 번 다 실패 시 에러
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            cleaned = re.sub(r"```json|```", "", raw).strip()
            try:
                data = json.loads(cleaned)
            except json.JSONDecodeError:
                _raise_llm_error("LLM_002")

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
            drug_interactions=data.get("drug_interactions", []),
            medication_schedules=data.get("medication_schedules", []),
        )


def get_analysis_service() -> AnalysisServiceBase:
    settings = get_settings()
    use_mock = getattr(settings, "use_mock_analysis", False)
    if use_mock:
        return MockAnalysisService()
    return OpenAIAnalysisService(api_key=settings.openai_api_key)
