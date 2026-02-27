from abc import ABC, abstractmethod
from typing import Optional
import base64


# ─────────────────────────────────────────
# Interface (추상 기반 클래스)
# ─────────────────────────────────────────
class OCRServiceBase(ABC):
    @abstractmethod
    async def extract_text(self, image_bytes: bytes) -> str:
        """이미지 바이트에서 텍스트 추출"""
        pass


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

        # 텍스트 필드 순서대로 추출
        texts = []
        for field in result.get("images", [])[0].get("fields", []):
            texts.append(field["inferText"])

        return " ".join(texts)


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

    if settings.use_mock_ocr:      # getattr 제거 — config에 명시적으로 선언되어 있으니까
        return MockOCRService()
    else:
        return ClovaOCRService()   # Google → Clova로 교체
