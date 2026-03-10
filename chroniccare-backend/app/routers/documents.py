import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models import Document, OCRResult
from app.services.ocr_service import get_ocr_service  # ✅ 이미 있음

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
]

@router.post("/upload", summary="처방전 이미지 업로드")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="지원하지 않는 파일 형식입니다. 허용: JPG, PNG, WEBP, PDF"
        )

    contents = await file.read()
    file_size = len(contents)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="파일 크기는 10MB를 초과할 수 없습니다."
        )

    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    # DB에 Document 저장
    document = Document(
        user_id=current_user.id,
        document_type="prescription",
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    # ✅ [추가 블록 1] OCR 실행
    ocr_service = get_ocr_service()
    extracted_text = await ocr_service.extract_text(contents)

    # ✅ [추가 블록 2] OCRResult DB 저장
    ocr_result = OCRResult(
        document_id=document.id,
        raw_text=extracted_text,
    )
    db.add(ocr_result)
    await db.commit()

    return {
        "message": "파일 업로드 성공",
        "document_id": document.id,
        "file_name": unique_filename,
        "file_size": file_size,
        "mime_type": file.content_type,
        "extracted_text": extracted_text  # ✅ OCR 결과 반환
    }


@router.get("/{document_id}", summary="문서 조회")
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    return {
        "id": document.id,
        "document_type": document.document_type,
        "file_path": document.file_path,
        "file_size": document.file_size,
        "mime_type": document.mime_type,
        "uploaded_at": document.uploaded_at
    }
