# app/services/drug_normalizer.py
"""
약물명 표준화 서비스
- OCR 오타, 대소문자 혼재, 영문/한글 혼재를 표준 한국어 약품명으로 정규화
- analyze_text() 와 독립적으로 동작 (기존 로직 영향 없음)
"""

import json
import logging
import re
from openai import AsyncOpenAI, APITimeoutError, RateLimitError, APIConnectionError

logger = logging.getLogger(__name__)

NORMALIZE_PROMPT = """
당신은 한국 의약품 전문가입니다.
아래 약품명 목록을 분석하여 표준화된 한국 의약품명으로 변환하세요.

[표준화 규칙]
1. 한글 약품명을 우선으로 사용하세요. (영문 → 한글 변환)
2. 용량 단위는 소문자로 통일하세요. (MG → mg, ML → ml)
3. 띄어쓰기를 올바르게 교정하세요.
4. OCR 오타를 수정하세요. (예: "아목시실닌" → "아목시실린")
5. 약품명 뒤 제형(정/캡슐/주사 등)은 유지하세요.
6. 용량 정보는 반드시 유지하세요.

[응답 형식] — JSON 배열만 반환, 다른 텍스트 금지
[
  {"original": "<원본 약품명>", "standardized": "<표준화된 약품명>", "changed": true/false},
  ...
]
"""


async def normalize_drug_names(
    drug_names: list[str],
    api_key: str,
) -> dict[str, str]:
    """
    약품명 목록을 받아 표준화된 이름으로 매핑한 딕셔너리 반환.

    반환 예시:
    {
        "트라마돌염산염정 37.5MG": "트라마돌염산염정 37.5mg",
        "아목시실닌 500mg":        "아목시실린 500mg",
    }

    LLM 호출 실패 시 원본 그대로 반환 (Graceful Degradation).
    """
    if not drug_names:
        return {}

    # 중복 제거
    unique_names = list(dict.fromkeys(drug_names))

    client = AsyncOpenAI(api_key=api_key)

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": NORMALIZE_PROMPT},
                {"role": "user", "content": "\n".join(f"- {name}" for name in unique_names)}
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content

        # json_object 모드는 최상위가 dict여야 해서 래핑된 경우 처리
        parsed = json.loads(raw)

        # {"results": [...]} 또는 {"medications": [...]} 형태로 올 수도 있음
        if isinstance(parsed, dict):
            items = next(
                (v for v in parsed.values() if isinstance(v, list)),
                []
            )
        else:
            items = parsed  # 직접 배열인 경우 (드물지만 방어)

        mapping = {}
        for item in items:
            original = item.get("original", "")
            standardized = item.get("standardized", original)
            if original:
                mapping[original] = standardized
                if item.get("changed"):
                    logger.info(f"[약물 표준화] '{original}' → '{standardized}'")

        # 원본에 없는 항목은 그대로 유지
        for name in unique_names:
            if name not in mapping:
                mapping[name] = name

        return mapping

    except (RateLimitError, APITimeoutError, APIConnectionError) as e:
        logger.warning(f"[약물 표준화] LLM 호출 실패 — 원본 유지: {e}")
        return {name: name for name in unique_names}
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.warning(f"[약물 표준화] 파싱 실패 — 원본 유지: {e}")
        return {name: name for name in unique_names}


def apply_normalization(
    medication_guide: str,
    drug_interactions: list,
    medication_schedules: list,
    mapping: dict[str, str],
) -> tuple[str, list, list]:
    """
    표준화 매핑을 실제 데이터에 적용.
    medication_guide (str), drug_interactions (list), medication_schedules (list) 모두 처리.
    """
    if not mapping:
        return medication_guide, drug_interactions, medication_schedules

    # 1. medication_guide 문자열 치환
    normalized_guide = medication_guide
    for original, standardized in mapping.items():
        if original != standardized:
            normalized_guide = normalized_guide.replace(original, standardized)

    # 2. drug_interactions 약품명 치환
    normalized_interactions = []
    for item in drug_interactions:
        normalized_interactions.append({
            **item,
            "medication_a": mapping.get(item.get("medication_a", ""), item.get("medication_a", "")),
            "medication_b": mapping.get(item.get("medication_b", ""), item.get("medication_b", "")),
        })

    # 3. medication_schedules 약품명 치환
    normalized_schedules = []
    for schedule in medication_schedules:
        sd = schedule.get("schedule_date", {})
        original_name = sd.get("drug_name", "")

        normalized_schedules.append({
            "schedule_date": {
                **sd,
                "drug_name": mapping.get(original_name, original_name),
            }
        })

    return normalized_guide, normalized_interactions, normalized_schedules
