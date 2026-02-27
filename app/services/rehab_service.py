# services/rehab_service.py
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

from openai import AsyncOpenAI


@dataclass
class RehabPlanResult:
    target_area: str
    duration_weeks: int
    precautions: str
    exercises: list = field(default_factory=list)
    # exercises 각 항목:
    # {
    #   exercise_id: str,
    #   week_number: int,
    #   sequence_order: int,
    #   sets: int,
    #   reps: int,
    #   duration_seconds: int,
    #   frequency_per_day: int,
    #   special_notes: str
    # }


class RehabServiceBase(ABC):
    @abstractmethod
    async def generate_rehab_plan(self, analysis_summary: str) -> RehabPlanResult:
        pass


# ─────────────────────────────────────────
# Mock
# ─────────────────────────────────────────
class MockRehabService(RehabServiceBase):
    async def generate_rehab_plan(self, analysis_summary: str) -> RehabPlanResult:
        return RehabPlanResult(
            target_area="무릎",
            duration_weeks=4,
            precautions="무릎에 과도한 하중을 피하세요. 통증이 심하면 즉시 중단하세요.",
            exercises=[
                {
                    "exercise_id": "knee01",
                    "week_number": 1,
                    "sequence_order": 1,
                    "sets": 3,
                    "reps": 10,
                    "duration_seconds": None,
                    "frequency_per_day": 2,
                    "special_notes": "천천히 진행하세요."
                },
                {
                    "exercise_id": "knee02",
                    "week_number": 1,
                    "sequence_order": 2,
                    "sets": 3,
                    "reps": 15,
                    "duration_seconds": None,
                    "frequency_per_day": 2,
                    "special_notes": None
                },
            ]
        )


# ─────────────────────────────────────────
# OpenAI
# ─────────────────────────────────────────
REHAB_SYSTEM_PROMPT = """
당신은 전문 물리치료사 AI입니다.
처방전 분석 요약을 바탕으로 재활 운동 플랜을 반드시 아래 JSON 형식으로만 응답하세요.

{
  "target_area": "<재활 대상 부위>",
  "duration_weeks": <주 단위 정수>,
  "precautions": "<주의사항>",
  "exercises": [
    {
      "exercise_id": "<exercise_library의 exercise_id>",
      "week_number": <주차 정수>,
      "sequence_order": <순서 정수>,
      "sets": <세트 수>,
      "reps": <반복 수>,
      "duration_seconds": <초 단위 또는 null>,
      "frequency_per_day": <하루 횟수>,
      "special_notes": "<특이사항 또는 null>"
    }
  ]
}
"""


class OpenAIRehabService(RehabServiceBase):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def generate_rehab_plan(self, analysis_summary: str) -> RehabPlanResult:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": REHAB_SYSTEM_PROMPT},
                {"role": "user", "content": f"분석 결과:\n{analysis_summary}"}
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        data = json.loads(response.choices[0].message.content)

        return RehabPlanResult(
            target_area=data.get("target_area", "전신"),
            duration_weeks=int(data.get("duration_weeks", 4)),
            precautions=data.get("precautions", ""),
            exercises=data.get("exercises", []),
        )


# ─────────────────────────────────────────
# Factory
# ─────────────────────────────────────────
def get_rehab_service() -> RehabServiceBase:
    from app.core.config import get_settings
    settings = get_settings()

    use_mock = getattr(settings, "use_mock_rehab", True)
    if use_mock:
        return MockRehabService()

    return OpenAIRehabService(api_key=settings.openai_api_key)
