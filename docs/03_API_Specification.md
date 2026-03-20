# ChronicCare Ortho API 명세서

**문서 버전:** v2.0  
**작성일:** 2026-02-25  
**최종 수정일:** 2026-03-20  
**Base URL:** `http://localhost:8000/api/v1`  
**인증 방식:** JWT Bearer Token (HS256, 24시간 유효)  
**응답 형식:** JSON

**문서 변경 이력:**
- v1.0 (2026-02-25): 초기 작성 (개발 시작 전)
- v2.0 (2026-03-20): ERD v3.0 기준 전면 수정

---

## 목차

### 1. 인증 (Authentication)
- 1.1 회원가입
- 1.2 로그인
- 1.3 토큰 갱신

### 2. 사용자 프로필 (User Profile)
- 2.1 건강 프로필 등록/수정
- 2.2 만성질환 목록 갱신 (PUT)
- 2.3 복용 약물 목록 갱신 (PUT)
- 2.4 알레르기 정보 갱신 (PUT)
- 2.5 프로필 조회
- 2.6 약물 검색 (자동완성)

### 3. 문서 및 OCR (Documents & OCR)
- 3.1 처방전 업로드
- 3.2 OCR 결과 조회
- 3.3 OCR 결과 수정
- 3.4 분석 요청

### 4. AI 분석 (AI Analysis)
- 4.1 분석 결과 조회
- 4.2 분석 결과 목록 조회

### 5. 재활 운동 (Rehabilitation)
- 5.1 재활 계획 조회
- 5.2 운동 라이브러리 조회
- 5.3 운동 완료 체크

### 6. 챗봇 (Chatbot)
- 6.0 활성 세션 조회 (이어하기)
- 6.1 챗봇 세션 시작
- 6.2 메시지 전송 (SSE 스트리밍)
- 6.3 대화 이력 조회
- 6.4 세션 종료

### 7. 피드백 (Feedbacks)
- 7.1 피드백 전송

### 8. 공통 응답 형식

### 9. 에러 코드

### 10. 비동기 작업 처리

### 11. 페이지네이션

### 12. 보안

### 13. 개발 우선순위

---

## 1. 인증 (Authentication)

### 1.1 회원가입

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "김영희",
  "birth_date": "1959-03-15",
  "gender": "F",
  "phone": "010-1234-5678"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "김영희",
    "created_at": "2026-03-20T10:30:00Z"
  },
  "message": "회원가입이 완료되었습니다."
}
```

**Validation:**
- `email`: 이메일 형식, 중복 체크
- `password`: 최소 8자, 영문+숫자+특수문자 포함
- `birth_date`: YYYY-MM-DD 형식
- `gender`: "M" 또는 "F"

**Error Cases:**
- `400 AUTH_004`: 이메일 중복
- `400 COMMON_001`: 비밀번호 형식 오류
- `400 COMMON_001`: 필수 필드 누락

---

### 1.2 로그인

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "name": "김영희"
    }
  },
  "message": "로그인 성공"
}
```

> ⚠️ `expires_in`: 3600 (1시간) → **86400 (24시간)** 으로 수정 (JWT 실제 유효기간 기준)

**Error Cases:**
- `401 AUTH_003`: 이메일 또는 비밀번호 오류
- `400 COMMON_001`: 필수 필드 누락

---

### 1.3 토큰 갱신

**Endpoint:** `POST /auth/refresh`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

---

## 2. 사용자 프로필 (User Profile)

### 2.1 건강 프로필 등록/수정

**Endpoint:** `POST /profile/health`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "height": 160.5,
  "weight": 58.3,
  "blood_type": "A",
  "smoking_status": "never",
  "alcohol_frequency": "monthly",
  "exercise_frequency": "1-2"
}
```

> ⚠️ 변경 사항:
> - `blood_type`: "A+" → **"A"** (A/B/O/AB/unknown)
> - `smoking_status`: "비흡연" → **"never"** (never/past/sometimes/daily)
> - `alcohol_frequency`: "가끔" → **"monthly"** (never/monthly/weekly/daily)
> - `exercise_frequency`: "주1-2회" → **"1-2"** (never/1-2/3-4/daily)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "profile_id": 1,
    "user_id": 1,
    "height": 160.5,
    "weight": 58.3,
    "bmi": 22.8,
    "blood_type": "A",
    "smoking_status": "never",
    "alcohol_frequency": "monthly",
    "exercise_frequency": "1-2",
    "updated_at": "2026-03-20T10:35:00Z"
  },
  "message": "건강 프로필이 저장되었습니다."
}
```

**Validation:**
- `blood_type`: A/B/O/AB/unknown 중 하나
- `smoking_status`: never/past/sometimes/daily 중 하나
- `alcohol_frequency`: never/monthly/weekly/daily 중 하나
- `exercise_frequency`: never/1-2/3-4/daily 중 하나
- `height`: 50~250 범위
- `weight`: 10~300 범위
- 모든 항목 선택 사항 (온보딩 건너뛰기 가능)

---

### 2.2 만성질환 목록 갱신

**Endpoint:** `PUT /profile/chronic-conditions`

**설명:** 기존 질환 목록을 삭제하고, 요청받은 목록으로 전체 교체합니다.

**Request Body:**
```json
{
  "conditions": [
    {
      "condition_type": "당뇨",
      "diagnosed_date": "2019-05-10",
      "severity": "중등도",
      "notes": "인슐린 치료 중"
    },
    {
      "condition_type": "골다공증",
      "diagnosed_date": "2021-08-15",
      "severity": "경증"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "conditions": [
      {
        "id": 1,
        "condition_type": "당뇨",
        "diagnosed_date": "2019-05-10",
        "severity": "중등도"
      },
      {
        "id": 2,
        "condition_type": "골다공증",
        "diagnosed_date": "2021-08-15",
        "severity": "경증"
      }
    ]
  },
  "message": "만성질환 정보가 갱신되었습니다."
}
```

**Validation:**
- `condition_type`: 고혈압/당뇨/고지혈증/골다공증/관절염/빈혈 또는 직접 입력
- `severity`: 경증/중등도/중증 중 하나

**Server Logic:**
1. 기존 `chronic_conditions` 중 `user_id` 일치하는 행 모두 삭제
2. 요청받은 배열의 각 항목을 새로 삽입
3. 트랜잭션으로 원자성 보장

---

### 2.3 복용 약물 목록 갱신

**Endpoint:** `PUT /profile/medications`

**설명:** 기존 약물 목록을 삭제하고, 요청받은 목록으로 전체 교체합니다.

**Request Body:**
```json
{
  "medications": [
    {
      "medication_name": "메트포르민정500mg",
      "dosage": "500mg",
      "frequency": 2,
      "timing": ["morning", "evening"],
      "medication_type": "CHRONIC"
    },
    {
      "medication_name": "알렌드로네이트정70mg",
      "dosage": "70mg",
      "frequency": 1,
      "timing": ["morning"],
      "medication_type": "CHRONIC"
    }
  ]
}
```

> ⚠️ 변경 사항:
> - `standardized_name`, `ingredient` 필드를 요청 Body에서 **제거**
> - 백엔드의 `drug_normalizer.py` (GPT-4o-mini)가 자동 생성하므로 클라이언트가 전송 불필요

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "medications": [
      {
        "id": 1,
        "medication_name": "메트포르민정500mg",
        "standardized_name": "메트포르민",
        "ingredient": "Metformin",
        "dosage": "500mg",
        "frequency": 2,
        "timing": ["morning", "evening"],
        "medication_type": "CHRONIC",
        "is_active": true,
        "created_at": "2026-03-20T10:00:00Z"
      },
      {
        "id": 2,
        "medication_name": "알렌드로네이트정70mg",
        "standardized_name": "알렌드로네이트",
        "ingredient": "Alendronate",
        "dosage": "70mg",
        "frequency": 1,
        "timing": ["morning"],
        "medication_type": "CHRONIC",
        "is_active": true,
        "created_at": "2026-03-20T10:00:00Z"
      }
    ]
  },
  "message": "복용 약물이 갱신되었습니다."
}
```

**Validation:**
- `frequency`: 1~4 사이의 정수
- `timing`: morning/lunch/evening/bedtime 중 선택
- `medication_type`: CHRONIC 또는 NEW

**Server Logic:**
1. 기존 `medications` 중 `user_id` 일치하는 행 모두 삭제
2. 요청받은 배열의 각 항목을 새로 삽입
3. `drug_normalizer.py` (GPT-4o-mini, temperature=0)로 `standardized_name`, `ingredient` 자동 생성
4. `is_active=true`로 설정
5. 트랜잭션으로 원자성 보장

---

### 2.4 알레르기 정보 갱신

**Endpoint:** `PUT /profile/allergies`

**설명:** 기존 알레르기 목록을 삭제하고, 요청받은 목록으로 전체 교체합니다.

> ⚠️ "알러지" → **"알레르기"** 로 표기 통일

**Request Body:**
```json
{
  "allergies": [
    {
      "allergen_name": "페니실린",
      "allergen_type": "약물",
      "severity": "중증",
      "reaction_description": "두드러기, 호흡곤란"
    },
    {
      "allergen_name": "땅콩",
      "allergen_type": "음식",
      "severity": "중등도",
      "reaction_description": "두드러기"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "allergies": [
      {
        "id": 1,
        "allergen_name": "페니실린",
        "allergen_type": "약물",
        "severity": "중증",
        "reaction_description": "두드러기, 호흡곤란"
      },
      {
        "id": 2,
        "allergen_name": "땅콩",
        "allergen_type": "음식",
        "severity": "중등도",
        "reaction_description": "두드러기"
      }
    ]
  },
  "message": "알레르기 정보가 갱신되었습니다."
}
```

**Server Logic:**
1. 기존 `allergies` 중 `user_id` 일치하는 행 모두 삭제
2. 요청받은 배열의 각 항목을 새로 삽입
3. 트랜잭션으로 원자성 보장

---

### 2.5 프로필 조회

**Endpoint:** `GET /profile`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "name": "김영희",
      "birth_date": "1959-03-15",
      "age": 67,
      "gender": "F"
    },
    "health": {
      "height": 160.5,
      "weight": 58.3,
      "bmi": 22.8,
      "blood_type": "A",
      "smoking_status": "never",
      "alcohol_frequency": "monthly",
      "exercise_frequency": "1-2"
    },
    "chronic_conditions": [
      {
        "condition_type": "당뇨",
        "diagnosed_date": "2019-05-10",
        "duration_years": 7
      },
      {
        "condition_type": "골다공증",
        "diagnosed_date": "2021-08-15",
        "duration_years": 5
      }
    ],
    "medications": [
      {
        "id": 1,
        "medication_name": "메트포르민정500mg",
        "standardized_name": "메트포르민",
        "ingredient": "Metformin",
        "dosage": "500mg",
        "frequency": 2,
        "timing": ["morning", "evening"],
        "medication_type": "CHRONIC",
        "is_active": true
      }
    ],
    "allergies": [
      {
        "allergen_name": "페니실린",
        "allergen_type": "약물",
        "severity": "중증"
      }
    ]
  }
}
```

---

### 2.6 약물 검색 (자동완성)

**Endpoint:** `GET /medications/search`

**Query Parameters:**
- `q`: 검색어 (예: "타이레놀"), 최소 2자
- `limit`: 결과 개수 (default: 10, max: 50)

**Request Example:**
```
GET /medications/search?q=타이레놀&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "medication_name": "타이레놀정500mg",
        "standardized_name": "타이레놀",
        "ingredient": "Acetaminophen",
        "manufacturer": "한국얀센",
        "common_dosages": ["500mg", "650mg"]
      },
      {
        "medication_name": "타이레놀8시간이알서방정",
        "standardized_name": "타이레놀",
        "ingredient": "Acetaminophen",
        "manufacturer": "한국얀센",
        "common_dosages": ["650mg"]
      }
    ],
    "total": 2
  }
}
```

**비즈니스 로직:**
- 검색어 2자 미만이면 400 에러
- `medication_name`, `standardized_name`, `ingredient` 모두 검색 대상
- 검색 결과는 사용 빈도순으로 정렬
- 프론트엔드 debounce 300ms 적용 권장

**Validation:**
- `q`: 최소 2자, 최대 50자
- `limit`: 1~50 사이

**Error Cases:**
- `400 COMMON_001`: 검색어 2자 미만
- `400 COMMON_001`: 검색어 50자 초과

---

## 3. 문서 및 OCR (Documents & OCR)

### 3.1 처방전 업로드

**Endpoint:** `POST /documents/upload`

**Request (multipart/form-data):**
```
file: (binary)
document_type: "PRESCRIPTION"
```

**지원 파일 형식:** JPG, PNG, WEBP, PDF (최대 10MB)

> ⚠️ 변경 사항: WEBP, PDF 형식 추가

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "document_id": 123,
    "file_path": "uploads/1_20260320_prescription.jpg",
    "file_size": 2048576,
    "mime_type": "image/jpeg",
    "uploaded_at": "2026-03-20T11:00:00Z",
    "processing_status": "PENDING"
  },
  "message": "처방전 업로드 완료. OCR 처리 중입니다."
}
```

> ⚠️ 변경 사항:
> - `file_url` → **`file_path`** (로컬 uploads/ 폴더 경로)
> - S3 URL 제거, 로컬 저장 기준으로 수정

**Validation:**
- 파일 형식: JPEG, PNG, WEBP, PDF
- 최대 용량: 10MB
- `document_type`: PRESCRIPTION/MEDICINE_BAG/TEST_RESULT 중 하나

**Error Cases:**
- `400 OCR_002`: 파일 형식 오류
- `413 OCR_001`: 파일 용량 초과 (10MB)
- `400 COMMON_001`: document_type 값이 유효하지 않음

**파일 저장:**
- 로컬 저장: `app/static/uploads/`
- FastAPI StaticFiles 마운트: `app.mount("/static", StaticFiles(directory="static"))`
- 로컬 스케줄러(APScheduler)로 24시간 후 자동 삭제

---

### 3.2 OCR 결과 조회

**Endpoint:** `GET /documents/{document_id}/ocr`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "ocr_result_id": 456,
    "document_id": 123,
    "processing_status": "SUCCESS",
    "confidence_score": 0.92,
    "hospital_name": "서울대학교병원",
    "prescribed_date": "2026-03-18",
    "medications": [
      {
        "name": "트라마돌",
        "dosage": "50mg",
        "frequency": 3,
        "timing": ["morning", "lunch", "evening"],
        "confidence": 0.95
      },
      {
        "name": "세파클러",
        "dosage": "500mg",
        "frequency": 2,
        "timing": ["morning", "evening"],
        "confidence": 0.89
      }
    ],
    "is_confirmed": false,
    "created_at": "2026-03-20T11:00:05Z"
  }
}
```

> ⚠️ 변경 사항:
> - `confidence_score`: 0~100 → **0~1** (ERD 기준)
> - `confidence_score < 0.7`이면 프론트엔드에서 경고 표시

**Processing Status:**
- `PENDING`: 처리 중
- `SUCCESS`: 완료
- `FAILED`: 실패

**Timing 값:**
- `morning`: 아침 (07:00~09:00)
- `lunch`: 점심 (12:00~14:00)
- `evening`: 저녁 (18:00~20:00)
- `bedtime`: 취침 전 (22:00~23:00)

**Error Cases:**
- `404 COMMON_002`: 문서를 찾을 수 없음
- `500 OCR_003`: OCR 처리 실패

---

### 3.3 OCR 결과 수정

**Endpoint:** `PUT /documents/{document_id}/ocr`

**설명:** OCR 결과를 수동으로 수정합니다. 수정 후 `3.4 분석 요청`을 호출해야 합니다.

**Request Body:**
```json
{
  "medications": [
    {
      "name": "트라마돌정50mg",
      "dosage": "50mg",
      "frequency": 3,
      "timing": ["morning", "lunch", "evening"]
    },
    {
      "name": "세파클러캡슐500mg",
      "dosage": "500mg",
      "frequency": 2,
      "timing": ["morning", "evening"]
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "ocr_result_id": 456,
    "is_confirmed": false,
    "medications": [
      {
        "name": "트라마돌정50mg",
        "dosage": "50mg",
        "frequency": 3,
        "timing": ["morning", "lunch", "evening"]
      },
      {
        "name": "세파클러캡슐500mg",
        "dosage": "500mg",
        "frequency": 2,
        "timing": ["morning", "evening"]
      }
    ],
    "updated_at": "2026-03-20T11:05:00Z"
  },
  "message": "OCR 결과가 수정되었습니다. '확인' 버튼을 눌러 분석을 시작하세요."
}
```

**Validation:**
- `frequency`: 1~4 사이의 정수
- `timing`: morning/lunch/evening/bedtime 중 선택
- 배열 길이는 frequency와 일치해야 함

**Error Cases:**
- `400 COMMON_001`: frequency와 timing 배열 길이 불일치
- `400 COMMON_001`: timing 값이 유효하지 않음

---

### 3.4 분석 요청

**Endpoint:** `POST /documents/{document_id}/analyze`

**설명:** 업로드된 문서에 대한 AI 분석을 요청합니다.  
BackgroundTasks로 비동기 처리되며, 완료까지 30~60초 소요됩니다.

**Request Body (Optional):**
```json
{
  "medications": [
    {
      "name": "트라마돌정",
      "dosage": "50mg",
      "frequency": 3,
      "timing": ["morning", "lunch", "evening"]
    }
  ]
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "guide_result_id": 789,
    "status": "pending",
    "estimated_time": "30-60초"
  },
  "message": "분석이 시작되었습니다. 잠시만 기다려주세요."
}
```

> ⚠️ 변경 사항:
> - `task_id` 제거 → **`guide_result_id`** 기반 폴링으로 통일
> - `status` 값: PROCESSING → **pending** (ERD guide_results.status 기준)

**Server Logic:**
1. Body에 medications가 있으면 `ocr_results.structured_data` 업데이트
2. `ocr_results.is_confirmed = true` 설정
3. `guide_results` 레코드 생성 (status='pending')
4. BackgroundTasks로 AI 분석 작업 시작
5. 202 Accepted 즉시 반환

**폴링 방법:**
- `GET /analysis/{guide_result_id}` 를 3초마다 폴링
- `status='completed'`가 되면 전체 결과 표시
- 최대 20회 폴링 (60초 타임아웃)

---

## 4. AI 분석 (AI Analysis)

### 4.1 분석 결과 조회

**Endpoint:** `GET /analysis/{guide_result_id}`

**Response - 처리 중 (200 OK):**
```json
{
  "success": true,
  "data": {
    "guide_result_id": 789,
    "status": "processing",
    "message": "약물 상호작용 분석 중..."
  }
}
```

**Response - 완료 (200 OK):**
```json
{
  "success": true,
  "data": {
    "guide_result_id": 789,
    "status": "completed",
    "user_id": 1,
    "overall_safety_score": 75,
    "summary": "당뇨와 골다공증 환자에게 처방된 진통제와 항생제입니다. 중등도 상호작용 1건이 발견되었습니다.",
    "medication_guide": "트라마돌은 어지러움을 유발할 수 있으므로 낙상에 주의하세요.",
    "lifestyle_guide": "골다공증 환자는 낙상 위험이 높으므로 실내 조명을 밝게 유지하세요.",
    "warning_signs": "심한 어지러움, 호흡곤란, 두드러기 발생 시 즉시 병원을 방문하세요.",
    "drug_interactions": [
      {
        "medication_a": "메트포르민",
        "medication_b": "세파클러",
        "severity": "medium",
        "mechanism": "신장 기능 저하 시 메트포르민 축적 위험",
        "recommendation": "복용 중 신장 기능 체크 권장"
      }
    ],
    "medication_schedules": {
      "schedule": [
        {
          "time_slot": "아침 식후",
          "medications": [
            { "medication_name": "메트포르민 500mg", "timing": "식후 30분" },
            { "medication_name": "트라마돌 50mg", "timing": "식후" },
            { "medication_name": "세파클러 500mg", "timing": "식후" }
          ],
          "special_instructions": "물 한 컵(200ml)과 함께 복용"
        },
        {
          "time_slot": "점심 식후",
          "medications": [
            { "medication_name": "트라마돌 50mg", "timing": "식후" }
          ]
        },
        {
          "time_slot": "저녁 식후",
          "medications": [
            { "medication_name": "메트포르민 500mg", "timing": "식후 30분" },
            { "medication_name": "트라마돌 50mg", "timing": "식후" },
            { "medication_name": "세파클러 500mg", "timing": "식후" }
          ]
        }
      ]
    },
    "rehab_plan": {
      "rehab_plan_id": 101,
      "target_area": "손목",
      "duration_weeks": 4,
      "precautions": "골다공증 환자이므로 무리한 하중 금지. 통증 발생 시 즉시 중단.",
      "exercises": [
        {
          "week": 1,
          "sequence_order": 1,
          "exercise_id": "wrist01",
          "exercise_name": "손목 굽히기/펴기",
          "difficulty_level": "EASY",
          "sets": 3,
          "reps": 10,
          "video_url": "https://youtube.com/watch?v=abc123",
          "special_notes": "통증 없는 범위에서만 실시"
        },
        {
          "week": 2,
          "sequence_order": 1,
          "exercise_id": "wrist02",
          "exercise_name": "손목 돌리기",
          "difficulty_level": "EASY",
          "sets": 3,
          "reps": 10,
          "video_url": "https://youtube.com/watch?v=def456"
        }
      ]
    },
    "generated_at": "2026-03-20T11:05:15Z"
  }
}
```

> ⚠️ 변경 사항:
> - `status` 필드 추가 (pending/processing/completed/failed)
> - `medication_schedules` 구조를 JSONB 형식과 일치하도록 수정
> - `exercise_id`: knee01 → **wrist01** (실제 구현 기준)
> - `difficulty` → **`difficulty_level`** (ERD 컬럼명 통일)
> - `goal` 필드 제거 (ERD에 없는 컬럼)

**Safety Score:**
- 80~100: 안전 (초록색)
- 60~79: 주의 (노란색)
- 0~59: 위험 (빨간색)

**Error Cases:**
- `404 COMMON_002`: 분석 결과를 찾을 수 없음
- `500 LLM_001`: LLM 분석 실패

---

### 4.2 분석 결과 목록 조회

**Endpoint:** `GET /analysis`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page`: 페이지 번호 (default: 1)
- `limit`: 페이지당 개수 (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "guide_result_id": 789,
        "status": "completed",
        "overall_safety_score": 75,
        "summary": "당뇨와 골다공증 환자에게 처방된 진통제와 항생제입니다.",
        "generated_at": "2026-03-20T11:05:15Z"
      },
      {
        "guide_result_id": 788,
        "status": "completed",
        "overall_safety_score": 85,
        "summary": "고혈압 환자에게 처방된 소염진통제입니다.",
        "generated_at": "2026-03-15T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "total_pages": 1
    }
  }
}
```

---

## 5. 재활 운동 (Rehabilitation)

### 5.1 재활 계획 조회

**Endpoint:** `GET /rehab/{rehab_plan_id}`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "rehab_plan_id": 101,
    "target_area": "손목",
    "duration_weeks": 4,
    "precautions": "골다공증 환자이므로 무리한 하중 금지. 통증 발생 시 즉시 중단.",
    "is_active": true,
    "weekly_exercises": [
      {
        "week": 1,
        "exercises": [
          {
            "rehab_exercise_id": 1,
            "sequence_order": 1,
            "exercise_id": "wrist01",
            "exercise_name": "손가락 굽히기/펴기",
            "difficulty_level": "EASY",
            "sets": 3,
            "reps": 10,
            "duration_seconds": null,
            "frequency_per_day": 2,
            "video_url": "https://youtube.com/watch?v=abc123",
            "description": "손가락을 천천히 쥐었다 폈다 반복 (손가락 펌핑)",
            "tags": ["손목", "급성기", "순환"],
            "special_notes": "통증 없는 범위에서만 실시"
          }
        ]
      },
      {
        "week": 2,
        "exercises": [
          {
            "rehab_exercise_id": 2,
            "sequence_order": 1,
            "exercise_id": "wrist01",
            "exercise_name": "손가락 굽히기/펴기",
            "difficulty_level": "EASY",
            "sets": 3,
            "reps": 15,
            "frequency_per_day": 2
          },
          {
            "rehab_exercise_id": 3,
            "sequence_order": 2,
            "exercise_id": "wrist02",
            "exercise_name": "손목 회전 운동",
            "difficulty_level": "EASY",
            "sets": 3,
            "reps": 10,
            "video_url": "https://youtube.com/watch?v=def456"
          }
        ]
      }
    ],
    "created_at": "2026-03-20T11:05:15Z"
  }
}
```

> ⚠️ 변경 사항:
> - `goal` 필드 제거 (ERD에 없는 컬럼)
> - `rehab_exercise_id` 추가 (완료 체크 시 필요)
> - `difficulty` → **`difficulty_level`** (ERD 컬럼명 통일)
> - `duration_seconds`, `frequency_per_day` 필드 추가 (ERD 기준)
> - `tags` 필드 추가 (exercise_library 조인)
> - exercise_id 예시: knee01 → **wrist01**

---

### 5.2 운동 라이브러리 조회

**Endpoint:** `GET /rehab/exercises`

**Query Parameters:**
- `category`: 손목/어깨/허리/무릎/발목 등
- `difficulty_level`: EASY/MEDIUM/HARD

**Request Example:**
```
GET /rehab/exercises?category=손목&difficulty_level=EASY
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "exercises": [
      {
        "exercise_id": "wrist01",
        "exercise_name": "손가락 굽히기/펴기",
        "category": "손목",
        "difficulty_level": "EASY",
        "description": "손가락을 천천히 쥐었다 폈다 반복 (손가락 펌핑)",
        "video_url": "https://youtube.com/watch?v=abc123",
        "thumbnail_url": "https://example.com/thumb/wrist01.jpg",
        "tags": ["손목", "급성기", "순환"]
      },
      {
        "exercise_id": "wrist02",
        "exercise_name": "손목 회전 운동",
        "category": "손목",
        "difficulty_level": "EASY",
        "description": "손목을 천천히 시계 방향, 반시계 방향으로 회전",
        "tags": ["손목", "가동범위", "유연성"]
      }
    ],
    "total": 2
  }
}
```

> ⚠️ 변경 사항:
> - `target_area` → **`category`** (ERD 컬럼명 통일)
> - `difficulty` → **`difficulty_level`** (ERD 컬럼명 통일)
> - `contraindications` 필드 제거 (ERD에 없는 컬럼)
> - `thumbnail_url` 필드 추가 (ERD 기준)
> - exercise_id 예시: knee01/knee02 → **wrist01/wrist02**

---

### 5.3 운동 완료 체크

**Endpoint:** `POST /rehab/exercises/{rehab_exercise_id}/complete`

> ⚠️ 변경 사항: URL 파라미터 `exercise_id` → **`rehab_exercise_id`**  
> (exercise_library의 ID가 아닌 rehab_exercises의 ID 기준)

**Request Body:**
```json
{
  "actual_sets": 3,
  "actual_reps": 10,
  "pain_level": 3,
  "notes": "손목이 조금 뻐근했지만 완료했습니다."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "completion_id": 456,
    "rehab_exercise_id": 1,
    "rehab_plan_id": 101,
    "completed_at": "2026-03-20T14:30:00Z",
    "actual_sets": 3,
    "actual_reps": 10,
    "pain_level": 3
  },
  "message": "운동 완료가 기록되었습니다."
}
```

> ⚠️ 변경 사항: `rehab_plan_id` 응답에 추가 (역정규화 반영)

**비즈니스 로직:**
- 같은 운동을 하루에 여러 번 완료 가능
- `pain_level > 7`이면 경고 문구 표시
- 주간 순응도 계산: 완료한 운동 수 / 계획된 운동 수 × 100
- `rehab_plan_id`는 서버에서 `rehab_exercises` 테이블 조회하여 자동 설정

---

## 6. 챗봇 (Chatbot)

### 6.0 활성 세션 조회 (이어하기)

**Endpoint:** `GET /chat/sessions/active`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session_id": 201,
    "context_type": "GUIDE",
    "context_id": 789,
    "session_status": "ACTIVE",
    "last_message": "운동해도 되나요?",
    "started_at": "2026-03-20T12:00:00Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "COMMON_002",
    "message": "활성 세션이 없습니다. 새로운 세션을 시작해주세요."
  }
}
```

**비즈니스 로직:**
- `session_status='ACTIVE'`인 가장 최근 세션 반환
- 활성 세션 없으면 404 반환
- 프론트엔드는 404 받으면 `POST /chat/sessions`로 새 세션 시작

---

### 6.1 챗봇 세션 시작

**Endpoint:** `POST /chat/sessions`

**Request Body:**
```json
{
  "context_type": "GUIDE",
  "context_id": 789
}
```

**context_type 설명:**
- `GUIDE`: 분석 결과에 대한 질문 → `guide_results` 전체 정보 주입
- `EXERCISE`: 특정 운동에 대한 질문 → 해당 운동 정보만 주입 (토큰 절약)
- `GENERAL`: 일반 건강 상담 → 컨텍스트 없이 대화

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "session_id": 201,
    "context_type": "GUIDE",
    "context_id": 789,
    "session_status": "ACTIVE",
    "started_at": "2026-03-20T12:00:00Z"
  },
  "message": "챗봇 세션이 시작되었습니다."
}
```

**비즈니스 로직:**
- 30분 이상 입력 없으면 자동으로 `session_status='CLOSED'`
- SSE 스트리밍 엔드포인트: `GET /chat/sessions/{session_id}/stream`

---

### 6.2 메시지 전송 (SSE 스트리밍)

**Endpoint:** `POST /chat/sessions/{session_id}/messages`

> ⚠️ 추가: SSE 스트리밍 방식 명시

**Request Body:**
```json
{
  "message": "트라마돌 먹으면 어지러운데 운동해도 되나요?"
}
```

**Response (200 OK) - 일반 방식:**
```json
{
  "success": true,
  "data": {
    "message_id": 301,
    "session_id": 201,
    "user_message": "트라마돌 먹으면 어지러운데 운동해도 되나요?",
    "assistant_message": "트라마돌은 어지러움을 유발할 수 있습니다.\n\n골다공증 환자분께서는 낙상 위험이 높으므로, 약 복용 후 30분간은 운동을 피하시고, 바닥에 앉아서 하는 운동(손가락 굽히기, 손목 회전)을 권장합니다.\n\n⚠️ 이 정보는 참고용이며, 정확한 진단과 치료는 담당 의사와 상담하세요.",
    "created_at": "2026-03-20T12:01:00Z"
  }
}
```

**SSE 스트리밍 방식 (`GET /chat/sessions/{session_id}/stream`):**
```
data: {"type": "token", "content": "트라마돌은"}
data: {"type": "token", "content": " 어지러움을"}
data: {"type": "token", "content": " 유발할 수 있습니다."}
data: {"type": "done", "message_id": 301}
```

**면책 조항:**
- 모든 응답에 `⚠️ 이 정보는 참고용이며, 정확한 진단과 치료는 담당 의사와 상담하세요.` 문구 필수 포함

---

### 6.3 대화 이력 조회

**Endpoint:** `GET /chat/sessions/{session_id}/messages`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session_id": 201,
    "messages": [
      {
        "message_id": 301,
        "role": "user",
        "content": "트라마돌 먹으면 어지러운데 운동해도 되나요?",
        "created_at": "2026-03-20T12:00:30Z"
      },
      {
        "message_id": 302,
        "role": "assistant",
        "content": "트라마돌은 어지러움을 유발할 수 있습니다...",
        "created_at": "2026-03-20T12:01:00Z"
      }
    ]
  }
}
```

---

### 6.4 세션 종료

**Endpoint:** `POST /chat/sessions/{session_id}/close`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session_id": 201,
    "session_status": "CLOSED",
    "ended_at": "2026-03-20T12:30:00Z"
  },
  "message": "챗봇 세션이 종료되었습니다."
}
```

---

## 7. 피드백 (Feedbacks)

### 7.1 피드백 전송

**Endpoint:** `POST /feedbacks`

**Request Body:**
```json
{
  "target_type": "CHAT",
  "target_id": 302,
  "rating": 1,
  "latency_ms": 2800,
  "comment": "설명이 너무 어려워요"
}
```

> ⚠️ 변경 사항: `latency_ms` 필드 추가 (P95 Latency 측정용)

**target_type 설명:**
- `CHAT`: 챗봇 메시지 (`target_id` = message_id)
- `GUIDE`: 분석 결과 (`target_id` = guide_result_id)
- `EXERCISE`: 운동 추천 (`target_id` = exercise_id)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "피드백이 반영되었습니다."
}
```

**비즈니스 로직:**
- `rating=0`인 응답은 프롬프트 개선 데이터로 활용
- `latency_ms` 누적으로 P95 응답속도 측정 → 발표 데이터 활용

---

## 8. 공통 응답 형식

### 8.1 성공 응답

```json
{
  "success": true,
  "data": { },
  "message": "작업이 완료되었습니다."
}
```

### 8.2 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "인증 토큰이 유효하지 않습니다.",
    "details": "Token has expired"
  }
}
```

---

## 9. 에러 코드

### 9.1 인증 관련 (AUTH)

| 코드 | HTTP | 설명 | 해결 방법 |
|:---:|:---:|:---|:---|
| `AUTH_001` | 401 | 토큰 만료 | 토큰 갱신 필요 |
| `AUTH_002` | 401 | 토큰 형식 오류 | Bearer 토큰 형식 확인 |
| `AUTH_003` | 401 | 로그인 실패 | 이메일/비밀번호 확인 |
| `AUTH_004` | 400 | 이메일 중복 | 다른 이메일 사용 |

### 9.2 OCR 관련 (OCR)

| 코드 | HTTP | 설명 | 해결 방법 |
|:---:|:---:|:---|:---|
| `OCR_001` | 413 | 파일 용량 초과 | 10MB 이하 파일 사용 |
| `OCR_002` | 400 | 파일 형식 오류 | JPEG/PNG/WEBP/PDF 사용 |
| `OCR_003` | 500 | OCR 처리 실패 | 재시도 또는 수동 입력 |
| `OCR_004` | 400 | 신뢰도 낮음 (0.7 미만) | OCR 결과 수정 필요 |

### 9.3 AI 분석 관련 (LLM)

| 코드 | HTTP | 설명 | 해결 방법 |
|:---:|:---:|:---|:---|
| `LLM_001` | 500 | LLM API 호출 실패 | 재시도 |
| `LLM_002` | 500 | 응답 형식 오류 | 재시도 |
| `LLM_003` | 504 | 타임아웃 (60초 초과) | 재시도 |

### 9.4 일반 오류 (COMMON)

| 코드 | HTTP | 설명 | 해결 방법 |
|:---:|:---:|:---|:---|
| `COMMON_001` | 400 | 필수 필드 누락 또는 유효성 오류 | 요청 데이터 확인 |
| `COMMON_002` | 404 | 리소스를 찾을 수 없음 | ID 확인 |
| `COMMON_003` | 500 | 서버 내부 오류 | 관리자 문의 |
| `COMMON_004` | 403 | 권한 없음 (타인 리소스 접근) | 소유권 확인 |

---

## 10. 비동기 작업 처리

분석 요청(`POST /documents/{document_id}/analyze`)은 BackgroundTasks로 비동기 처리됩니다.

### 폴링 방식 (권장)

```
1. POST /documents/{document_id}/analyze → guide_result_id 반환
2. GET /analysis/{guide_result_id} 를 3초마다 폴링
3. status='completed' 확인 시 결과 표시
4. 최대 20회 폴링 (60초 타임아웃)
```

### Status 값

| Status | 설명 |
|:---:|:---|
| `pending` | 대기 중 |
| `processing` | 처리 중 |
| `completed` | 완료 |
| `failed` | 실패 |

---

## 11. 페이지네이션

모든 목록 조회 API는 페이지네이션을 지원합니다.

**Query Parameters:**
```
page=1
limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "total_pages": 3
    }
  }
}
```

---

## 12. 보안

### 12.1 인증 헤더
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 12.2 토큰 저장
```
저장 위치: sessionStorage (XSS 공격 시 탭 종료 시 자동 삭제)
유효기간: 24시간 (HS256)
```

### 12.3 CORS 설정
```
허용 Origin: http://localhost:3000 (개발)
허용 Method: GET, POST, PUT, DELETE
허용 Header: Authorization, Content-Type
```

### 12.4 Rate Limiting
```
일반 API:  100 requests/minute
OCR API:    10 requests/minute
챗봇 API:   30 requests/minute
```

### 12.5 데이터 소유권 검증
```
모든 데이터 조회/수정 시 user_id 소유권 검증
타인 리소스 접근 시 403 COMMON_004 반환
```

---

## 13. 개발 우선순위

### Phase 1 (Day 3~5) - 필수
```
 POST /auth/register
 POST /auth/login
 POST /profile/health
 PUT  /profile/chronic-conditions
 PUT  /profile/medications
 PUT  /profile/allergies
 POST /documents/upload
 GET  /documents/{id}/ocr
 PUT  /documents/{id}/ocr
 POST /documents/{id}/analyze
 GET  /analysis/{id}
```

### Phase 2 (Day 6~9) - 중요
```
 GET  /profile
 GET  /rehab/{id}
 POST /rehab/exercises/{rehab_exercise_id}/complete
 GET  /chat/sessions/active
 POST /chat/sessions
 POST /chat/sessions/{id}/messages
 GET  /chat/sessions/{id}/messages
 POST /feedbacks
```

### Phase 3 (Day 10~12) - 선택
```
 GET  /analysis (목록)
 GET  /rehab/exercises (라이브러리)
 POST /chat/sessions/{id}/close
 POST /auth/refresh
```
```
