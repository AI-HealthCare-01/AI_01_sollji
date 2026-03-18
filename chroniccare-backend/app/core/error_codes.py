# app/core/error_codes.py

from fastapi import HTTPException


ERROR_CODES = {
    # OCR 관련
    "OCR_001": {"status": 400, "message": "지원하지 않는 파일 형식입니다.", "hint": "JPG, PNG, WEBP, PDF 파일만 업로드 가능합니다."},
    "OCR_002": {"status": 400, "message": "파일 크기가 너무 큽니다.", "hint": "10MB 이하의 파일을 업로드해주세요."},
    "OCR_003": {"status": 502, "message": "OCR 처리 중 오류가 발생했습니다.", "hint": "이미지 품질을 확인하거나 잠시 후 다시 시도해주세요."},
    "OCR_004": {"status": 404, "message": "OCR 결과를 찾을 수 없습니다.", "hint": "먼저 이미지를 업로드해주세요."},
    "OCR_005": {"status": 422, "message": "처방전 텍스트를 인식할 수 없습니다.", "hint": "선명한 이미지로 다시 시도해주세요."},
    # LLM 분석 관련
    "LLM_001": {"status": 502, "message": "AI 분석 서비스에 연결할 수 없습니다.", "hint": "잠시 후 다시 시도해주세요."},
    "LLM_002": {"status": 422, "message": "AI 응답 파싱에 실패했습니다.", "hint": "처방전 내용이 올바른지 확인해주세요."},
    "LLM_003": {"status": 429, "message": "AI 분석 요청이 너무 많습니다.", "hint": "잠시 후 다시 시도해주세요."},
    "LLM_004": {"status": 504, "message": "AI 분석 시간이 초과되었습니다.", "hint": "네트워크 상태를 확인하고 다시 시도해주세요."},
    # 인증 관련
    "AUTH_001": {"status": 401, "message": "인증이 필요합니다.", "hint": "로그인 후 다시 시도해주세요."},
    "AUTH_002": {"status": 401, "message": "토큰이 만료되었습니다.", "hint": "다시 로그인해주세요."},
    "AUTH_003": {"status": 403, "message": "접근 권한이 없습니다.", "hint": "본인의 데이터만 조회할 수 있습니다."},
    # 리소스 관련
    "RES_001": {"status": 404, "message": "문서를 찾을 수 없습니다.", "hint": "삭제되었거나 존재하지 않는 문서입니다."},
    "RES_002": {"status": 404, "message": "분석 결과를 찾을 수 없습니다.", "hint": "먼저 처방전 분석을 요청해주세요."},
    "RES_003": {"status": 404, "message": "재활 플랜을 찾을 수 없습니다.", "hint": "처방전 분석 후 자동으로 생성됩니다."},
}


def raise_error(code: str) -> None:
    """
    사용 예시:
        raise_error("OCR_001")
        raise_error("LLM_002")
    """
    error = ERROR_CODES.get(code)
    if not error:
        raise HTTPException(
            status_code=500,
            detail={"code": "UNKNOWN", "message": "알 수 없는 오류가 발생했습니다.", "hint": ""}
        )
    raise HTTPException(
        status_code=error["status"],
        detail={
            "code": code,
            "message": error["message"],
            "hint": error["hint"],
        }
    )
