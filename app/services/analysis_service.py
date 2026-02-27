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
    overall_safety_score: int
    summary: str
    medication_guide: str
    lifestyle_guide: str
    warning_signs: str


# ─────────────────────────────────────────
# Helper
# ─────────────────────────────────────────
def _to_str(value) -> str:
    """GPT가 list로 반환할 경우 문자열로 변환"""
    if isinstance(value, list):
        return "\n".join(str(v) for v in value)
    return str(value) if value else ""


# ─────────────────────────────────────────
# Base
# ─────────────────────────────────────────
class AnalysisServiceBase(ABC):
    @abstractmethod
    async def analyze_text(self, text: str) -> AnalysisResult:
        pass


# ─────────────────────────────────────────
# Mock (개발/테스트용 — 건드리지 않음)
# ─────────────────────────────────────────
class MockAnalysisService(AnalysisServiceBase):
    async def analyze_text(self, text: str) -> AnalysisResult:
        return AnalysisResult(
            overall_safety_score=85,
            summary="처방전 분석 완료. 총 3종의 약물이 확인되었습니다.",
            medication_guide=(
                "1. 아목시실린 500mg - 1일 3회, 5일분 (항생제, 식후 복용)\n"
                "2. 이부프로펜 400mg - 1일 2회, 3일분 (소염진통제, 공복 금지)\n"
                "3. 판토프라졸 40mg - 1일 1회, 7일분 (위장약, 식전 복용)"
            ),
            lifestyle_guide="충분한 수분 섭취를 권장합니다. 항생제 복용 중 음주는 삼가세요.",
            warning_signs="페니실린 알레르기가 있는 경우 즉시 복용을 중단하고 의사에게 문의하세요."
        )


# ─────────────────────────────────────────
# OpenAI (실제 연동)
# ─────────────────────────────────────────
SYSTEM_PROMPT = """
당신은 전문 약사이자 의료 AI 어시스턴트입니다.
사용자가 제공하는 처방전 OCR 텍스트를 분석하여 반드시 아래 JSON 형식으로만 응답하세요.
다른 텍스트는 절대 포함하지 마세요.

{
  "overall_safety_score": <0~100 사이 정수, 100이 가장 안전>,
  "summary": "<처방전 전체 요약, 2~3문장>",
  "medication_guide": "<각 약물별 복용법, 주의사항을 번호 목록으로>",
  "lifestyle_guide": "<식이요법, 운동, 생활습관 권고사항>",
  "warning_signs": "<즉시 병원 방문이 필요한 위험 증상들>"
}
"""


class OpenAIAnalysisService(AnalysisServiceBase):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def analyze_text(self, text: str) -> AnalysisResult:

        # ⏱️ latency 측정 시작
        start = time.time()

        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"다음 처방전을 분석해주세요:\n\n{text}"}
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )

        # ⏱️ latency 측정 종료
        latency_ms = int((time.time() - start) * 1000)
        usage = response.usage

        logger.info(
            f"[LLM] analysis | latency={latency_ms}ms | "
            f"prompt_tokens={usage.prompt_tokens} | "
            f"completion_tokens={usage.completion_tokens} | "
            f"total_tokens={usage.total_tokens}"
        )

        raw = response.choices[0].message.content

        # JSON 파싱 (기존 코드 그대로)
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            cleaned = re.sub(r"```json|```", "", raw).strip()
            data = json.loads(cleaned)

        return AnalysisResult(
            overall_safety_score=int(data.get("overall_safety_score", 50)),
            summary=_to_str(data.get("summary", "")),
            medication_guide=_to_str(data.get("medication_guide", "")),
            lifestyle_guide=_to_str(data.get("lifestyle_guide", "")),
            warning_signs=_to_str(data.get("warning_signs", "")),
        )


# ─────────────────────────────────────────
# Factory — .env의 USE_MOCK_ANALYSIS로 전환
# ─────────────────────────────────────────
def get_analysis_service() -> AnalysisServiceBase:
    from app.core.config import get_settings
    settings = get_settings()

    use_mock = getattr(settings, "use_mock_analysis", True)
    if use_mock:
        return MockAnalysisService()

    return OpenAIAnalysisService(api_key=settings.openai_api_key)
