from abc import ABC, abstractmethod
from typing import Optional
import base64
import re


# ─────────────────────────────────────────
# Interface (추상 기반 클래스)
# ─────────────────────────────────────────
class OCRServiceBase(ABC):
    @abstractmethod
    async def extract_text(self, image_bytes: bytes) -> str:
        """이미지 바이트에서 텍스트 추출"""
        pass


# ─────────────────────────────────────────
# ICD 코드 후처리 유틸
# ─────────────────────────────────────────
def _fix_icd_codes(text: str) -> str:
    """
    Clova OCR이 'S 5 2 5' 처럼 ICD 코드를 띄어서 읽는 문제 보정.
    알파벳 1자 + 숫자들이 공백으로 분리된 패턴을 붙여줌.
    예: 'S 5 2 5' → 'S525', 'I 2 1 9' → 'I219'
    """
    # 4자리 코드: A 1 2 3 → A123
    text = re.sub(r'\b([A-Z])\s+(\d)\s+(\d)\s+(\d)\b', r'\1\2\3\4', text)
    # 3자리 코드: A 1 2 → A12
    text = re.sub(r'\b([A-Z])\s+(\d)\s+(\d)\b', r'\1\2\3', text)
    # 소수점 포함: A123 . 4 → A123.4
    text = re.sub(r'\b([A-Z]\d{2,3})\s*\.\s*(\d)\b', r'\1.\2', text)
    return text


# ─────────────────────────────────────────
# Mock 구현체 (API 키 없이 테스트용)
# ─────────────────────────────────────────
class MockOCRService(OCRServiceBase):
    async def extract_text(self, image_bytes: bytes) -> str:
        return """
        [처방전 - Mock 데이터]
        환자명: 홍길동
        병원명: 서울내과의원
        처방일: 2026-02-26

        처방 의약품:
        1. 아목시실린 500mg - 1일 3회, 5일분
        2. 이부프로펜 400mg - 1일 2회, 3일분
        3. 판토프라졸 40mg  - 1일 1회, 7일분
        """


# ─────────────────────────────────────────
# Naver Clova OCR 구현체 (실제 연동)
# ─────────────────────────────────────────
class ClovaOCRService(OCRServiceBase):
    def __init__(self):
        from app.core.config import get_settings
        settings = get_settings()
        self.api_url = settings.clova_ocr_apigw_url
        self.secret_key = settings.clova_ocr_secret

    async def extract_text(self, image_bytes: bytes) -> str:
        import httpx
        import uuid
        import time

        headers = {
            "X-OCR-SECRET": self.secret_key,
            "Content-Type": "application/json"
        }

        payload = {
            "version": "V2",
            "requestId": str(uuid.uuid4()),
            "timestamp": int(time.time() * 1000),
            "lang": "ko",
            "images": [
                {
                    "format": "png",
                    "data": base64.b64encode(image_bytes).decode("utf-8"),
                    "name": "prescription"
                }
            ]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.api_url,
                headers=headers,
                json=payload
            )

        if response.status_code != 200:
            raise RuntimeError(f"Clova OCR API 오류: {response.status_code} - {response.text}")

        result = response.json()
        fields = result.get("images", [])[0].get("fields", [])

        # ─────────────────────────────────────────
        # 위치 정보(y/x 좌표) 기반 줄 단위 조합
        # 기존: " ".join(texts) → 공간 정보 손실
        # 변경: y좌표로 같은 줄 묶고, x좌표로 순서 정렬
        # ─────────────────────────────────────────
        lines: dict[int, list[tuple[int, str]]] = {}

        for field in fields:
            vertices = field.get("boundingPoly", {}).get("vertices", [])
            if not vertices:
                # 위치 정보 없으면 맨 마지막 줄에 추가
                max_key = max(lines.keys(), default=0)
                lines.setdefault(max_key, []).append((9999, field["inferText"]))
                continue

            y = vertices[0].get("y", 0)
            x = vertices[0].get("x", 0)

            # y좌표를 15px 단위로 묶어서 같은 줄로 처리
            # (처방전 폰트 크기에 따라 10~20 사이로 조정 가능)
            line_key = round(y / 15)

            lines.setdefault(line_key, []).append((x, field["inferText"]))

        # 줄 순서대로, 같은 줄은 x좌표 순서대로 조합
        result_lines = []
        for line_key in sorted(lines.keys()):
            line_texts = [text for _, text in sorted(lines[line_key])]
            result_lines.append(" ".join(line_texts))

        raw_text = "\n".join(result_lines)

        # ─────────────────────────────────────────
        # ICD 코드 후처리: "S 5 2 5" → "S525"
        # ─────────────────────────────────────────
        return _fix_icd_codes(raw_text)


# ─────────────────────────────────────────
# Google Vision 구현체 (레거시 — 미사용)
# ─────────────────────────────────────────
class GoogleVisionOCRService(OCRServiceBase):
    def __init__(self, credentials_path: Optional[str] = None):
        try:
            from google.cloud import vision
            import google.auth
            self.vision = vision
        except ImportError:
            raise RuntimeError("google-cloud-vision 패키지가 필요합니다: pip install google-cloud-vision")

    async def extract_text(self, image_bytes: bytes) -> str:
        import asyncio
        from google.cloud import vision

        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_bytes)

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.text_detection(image=image)
        )

        if response.error.message:
            raise RuntimeError(f"Google Vision API 오류: {response.error.message}")

        texts = response.text_annotations
        return texts[0].description if texts else ""


# ─────────────────────────────────────────
# 팩토리 함수 — 환경변수로 스위칭
# ─────────────────────────────────────────
def get_ocr_service() -> OCRServiceBase:
    from app.core.config import get_settings
    settings = get_settings()

    if settings.use_mock_ocr:
        return MockOCRService()
    else:
        return ClovaOCRService()
