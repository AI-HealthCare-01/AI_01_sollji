# ChronicCare Ortho API 명세서

**문서 버전:** v1.0  
**작성일:** 2026-02-25  
**Base URL:** `http://localhost:8000/api/v1`  
**인증 방식:** JWT Bearer Token  
**응답 형식:** JSON

**문서 변경 이력:**
- v1.0 (2026-02-25): 초기 작성 (개발 시작 전)

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
- 2.4 알러지 정보 갱신 (PUT)
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
- 6.2 메시지 전송
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
    "created_at": "2026-02-25T10:30:00Z"
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
- `400`: 이메일 중복
- `400`: 비밀번호 형식 오류
- `400`: 필수 필드 누락

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
    "expires_in": 3600,
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "name": "김영희"
    }
  },
  "message": "로그인 성공"
}
```

**Error Cases:**
- `401`: 이메일 또는 비밀번호 오류
- `400`: 필수 필드 누락

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
    "expires_in": 3600
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
  "blood_type": "A+",
  "smoking_status": "비흡연",
  "alcohol_frequency": "가끔",
  "exercise_frequency": "주1-2회"
}
```

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
    "updated_at": "2026-02-25T10:35:00Z"
  },
  "message": "건강 프로필이 저장되었습니다."
}
```

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
      { "id": 1, "condition_type": "당뇨", ... },
      { "id": 2, "condition_type": "골다공증", ... }
    ]
  },
  "message": "만성질환 정보가 갱신되었습니다."
}
```

**Validation:**
- `condition_type`: "당뇨", "고혈압", "골다공증" 중 하나
- `severity`: "경증", "중등도", "중증" 중 하나

**Server Logic:**

1. 기존 chronic_conditions 중 user_id가 일치하는 행 모두 삭제
2. 요청받은 배열의 각 항목을 새로 삽입
3. 트랜잭션으로 묶어서 원자성 보장

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
      "standardized_name": "메트포르민",
      "ingredient": "Metformin",
      "dosage": "500mg",
      "frequency": 2,  // ⚠️ Integer (1~4)
      "timing": ["morning", "evening"],  // ⚠️ JSON Array
      "medication_type": "CHRONIC"  // "CHRONIC" 또는 "NEW"
    },
    {
      "medication_name": "알렌드로네이트정70mg",
      "standardized_name": "알렌드로네이트",
      "ingredient": "Alendronate",
      "dosage": "70mg",
      "frequency": 1,
      "timing": ["morning"],
      "medication_type": "CHRONIC"
    }
  ]
}
```

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
        "created_at": "2026-02-26T10:00:00Z"
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
        "created_at": "2026-02-26T10:00:00Z"
      }
    ]
  },
  "message": "복용 약물이 갱신되었습니다."
}
```

**Validation:**
- frequency: 1~4 사이의 정수 (CHECK 제약 조건)
- timing: ["morning", "lunch", "evening", "bedtime"] 중 선택
- medication_type: "CHRONIC" 또는 "NEW"

**Server Logic:**
1. 기존 medications 중 user_id가 일치하는 행 모두 삭제
2. 요청받은 배열의 각 항목을 새로 삽입
3. 트랜잭션으로 묶어서 원자성 보장
4. is_active=true로 설정

---

### 2.4 알러지 정보 등록

**Endpoint:** `PUT /profile/allergies`

**설명:**  기존 알러지 목록을 삭제하고, 요청받은 목록으로 전체 교체합니다.

**Request Body:**
```json
{
  "allergies": [
    {
      "allergen_name": "페니실린",
      "allergen_type": "약물",
      "severity": "중증",
      "reaction_description": "두드러기, 호흡곤란"
    }
  ]
}
```

**Server Logic:**
1. 기존 allergies 중 user_id가 일치하는 행 모두 삭제
2. 요청받은 배열의 각 항목을 새로 삽입
3. 트랜잭션으로 묶어서 원자성 보장

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
      }
    ]
  },
  "message": "알러지 정보가 갱신되었습니다."
}
```

---

### 2.5 프로필 조회

**Endpoint:** `GET /profile`

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
      "blood_type": "A+"
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
        "medication_name": "메트포르민정500mg",
        "standardized_name": "메트포르민",
        "dosage": "500mg",
        "frequency": 2,  // Integer
        "timing": ["morning", "evening"],  // Array
        "medication_type": "CHRONIC"
      }
    ],
    "allergies": [
      {
        "allergen_name": "페니실린",
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
- `q`: 검색어 (예: "타이레놀")
- `limit`: 결과 개수 (default: 10)

**Request Example:**
GET /medications/search?q=타이레놀&limit=10

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

**프론트엔드 구현:**
```javascript
// 사용자가 입력할 때마다 호출 (debounce 300ms)
const searchMedications = async (query) => {
  if (query.length < 2) return;
  const response = await fetch(`/medications/search?q=${query}`);
  const data = await response.json();
  showAutocomplete(data.results);
};
```

**비즈니스 로직:**
- 검색어가 2자 미만이면 400 에러
- medication_name, standardized_name, ingredient 모두 검색 대상
- 검색 결과는 사용 빈도순으로 정렬
- Seed Data에서 검색 (DB: medications_library 테이블)

**Validation:**
- q: 최소 2자, 최대 50자
- limit: 1~50 사이

**Error Cases:**
- 400: 검색어가 너무 짧음 (2자 미만)
- 400: 검색어가 너무 김 (50자 초과)

---

## 3. 문서 및 OCR (Documents & OCR)

### 3.1 처방전 업로드

**Endpoint:** `POST /documents/upload`

**Request (multipart/form-data):**
```
file: (binary)
document_type: "PRESCRIPTION"  // "PRESCRIPTION", "MEDICINE_BAG", "TEST_RESULT"
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "document_id": 123,
    "file_url": "http://localhost:8000/static/uploads/1_20260225_prescription.jpg",
    "file_size": 2048576,
    "mime_type": "image/jpeg",
    "uploaded_at": "2026-02-25T11:00:00Z",
    "processing_status": "PENDING"
  },
  "message": "처방전 업로드 완료. OCR 처리 중입니다."
}
```

**Validation:**
- 파일 형식: JPEG, PNG, PDF
- 최대 용량: 10MB
- `document_type`: "PRESCRIPTION", "MEDICINE_BAG", "TEST_RESULT" 중 하나

**Error Cases:**
- `400`: 파일 형식 오류
- `413`: 파일 용량 초과 (10MB)
- `400`: document_type 값이 유효하지 않음

**개발 환경:**
- 로컬 파일 저장: app/static/uploads/
- FastAPI StaticFiles 마운트: app.mount("/static", StaticFiles(directory="static"))

**배포 환경 (나중에):**
- S3 업로드
- CloudFront URL 반환
- 24시간 후 자동 삭제 (Lambda)

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
    "prescribed_date": "2026-02-20",
    "medications": [
      {
        "name": "트라마돌",
        "dosage": "50mg",
        "frequency": 3,  // ⚠️ Integer (ERD 일치)
        "timing": ["morning", "lunch", "evening"],  // ⚠️ Array (ERD 일치)
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
    "created_at": "2026-02-25T11:00:05Z"
  }
}
```

**Processing Status:**
- `PENDING`: 처리 중
- `SUCCESS`: 완료
- `FAILED`: 실패

**Timing 값:**
- "morning": 아침 (07:00~09:00)
- "lunch": 점심 (12:00~14:00)
- "evening": 저녁 (18:00~20:00)
- "bedtime": 취침 전 (22:00~23:00)

**Error Cases:**
- `404`: 문서를 찾을 수 없음
- `500`: OCR 처리 실패

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
      "frequency": 3,  // ⚠️ Integer (1~4)
      "timing": ["morning", "lunch", "evening"]  // ⚠️ Array
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
    "updated_at": "2026-02-25T11:05:00Z"
  },
  "message": "OCR 결과가 수정되었습니다. '확인' 버튼을 눌러 분석을 시작하세요."
}
```
**Validation:**
- frequency: 1~4 사이의 정수
- timing: ["morning", "lunch", "evening", "bedtime"] 중 선택
- 배열 길이는 frequency와 일치해야 함

**Error Cases:**
- 400: frequency와 timing 배열 길이 불일치
- 400: timing 값이 유효하지 않음

---

### 3.4 분석 요청 

**Endpoint:** `POST /documents/{document_id}/analyze`

**설명:** 업로드된 문서에 대한 AI 분석을 요청합니다. 비동기 처리되며, 완료까지 30-60초 소요됩니다.

**Request Body (Optional):**
```json
{
  "medications": [
    {
      "name": "트라마돌정",
      "dosage": "50mg",
      "frequency": 3,  // Integer
      "timing": ["morning", "lunch", "evening"]  // Array
    }
  ]
}
```

**Server Logic:**

1. Body에 medications가 있으면:
   - ocr_results.structured_data 업데이트
2. ocr_results.is_confirmed = true 설정
3. Celery/Async로 AI 분석 작업 시작
4. 202 Accepted 응답

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "guide_result_id": 789,
    "task_id": "task_abc123",
    "status": "PROCESSING",
    "estimated_time": "30-60초"
  },
  "message": "분석이 시작되었습니다. 잠시만 기다려주세요."
}
```

**비즈니스 로직:**
- 비동기 작업 시작 후 즉시 202 Accepted 반환
- 프론트엔드는 다음 중 하나로 완료 확인:
  - 방법 1 (권장): GET /analysis/{guide_result_id}를 2초마다 폴링
  - 방법 2: GET /tasks/{task_id}를 2초마다 폴링 (10.1 참조)
- status='COMPLETED'가 되면 GET /analysis/{guide_result_id}로 전체 결과 조회

---

## 4. AI 분석 (AI Analysis)

### 4.1 분석 결과 조회

**Endpoint:** `GET /analysis/{guide_result_id}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "guide_result_id": 789,
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
    "medication_schedules": [
      {
        "time_slot": "아침 식후",
        "medications": [
          "메트포르민 500mg",
          "트라마돌 50mg",
          "세파클러 500mg"
        ],
        "special_instructions": "물 한 컵(200ml)과 함께 복용"
      },
      {
        "time_slot": "점심 식후",
        "medications": [
          "트라마돌 50mg"
        ]
      },
      {
        "time_slot": "저녁 식후",
        "medications": [
          "메트포르민 500mg",
          "트라마돌 50mg",
          "세파클러 500mg"
        ]
      },
      {
        "time_slot": "취침 전",
        "medications": []
      }
    ],
    "rehab_plan": {
      "rehab_plan_id": 101,
      "target_area": "손목",
      "duration_weeks": 4,
      "goal": "손목 가동범위 정상 회복 및 악력 강화",
      "precautions": "골다공증 환자이므로 무리한 하중 금지. 통증 발생 시 즉시 중단.",
      "exercises": [
        {
          "week": 1,
          "exercise_id": "wrist01",
          "exercise_name": "손목 굽히기/펴기",
          "sets": 3,
          "reps": 10,
          "video_url": "https://youtube.com/watch?v=abc123",
          "special_notes": "통증 없는 범위에서만 실시"
        },
        {
          "week": 2,
          "exercise_id": "wrist02",
          "exercise_name": "손목 돌리기",
          "sets": 3,
          "reps": 10,
          "video_url": "https://youtube.com/watch?v=def456"
        }
      ]
    },
    "generated_at": "2026-02-25T11:05:15Z"
  }
}
```

**Safety Score:**
- 80~100: 안전 (초록색)
- 60~79: 주의 (노란색)
- 0~59: 위험 (빨간색)

---

### 4.2 분석 결과 목록 조회

**Endpoint:** `GET /analysis`

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
        "overall_safety_score": 75,
        "summary": "당뇨와 골다공증 환자에게 처방된 진통제와 항생제입니다.",
        "generated_at": "2026-02-25T11:05:15Z"
      },
      {
        "guide_result_id": 788,
        "overall_safety_score": 85,
        "summary": "고혈압 환자에게 처방된 소염진통제입니다.",
        "generated_at": "2026-02-20T14:30:00Z"
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

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "rehab_plan_id": 101,
    "target_area": "손목",
    "duration_weeks": 4,
    "goal": "손목 가동범위 정상 회복 및 악력 강화",
    "precautions": "골다공증 환자이므로 무리한 하중 금지. 통증 발생 시 즉시 중단.",
    "weekly_exercises": [
      {
        "week": 1,
        "exercises": [
          {
            "sequence_order": 1,
            "exercise_id": "wrist01",
            "name": "손목 굽히기/펴기",
            "difficulty": "low",
            "sets": 3,
            "reps": 10,
            "video_url": "https://youtube.com/watch?v=abc123",
            "instructions": "1. 팔을 앞으로 뻗습니다.\n2. 손목을 천천히 위아래로 움직입니다.\n3. 통증 없는 범위에서만 실시합니다.",
            "tags": ["diabetes_safe", "osteoporosis_safe", "low_intensity"]
          }
        ]
      },
      {
        "week": 2,
        "exercises": [
          {
            "sequence_order": 1,
            "exercise_id": "wrist01",
            "name": "손목 굽히기/펴기",
            "sets": 3,
            "reps": 15
          },
          {
             "sequence_order": 2,
            "exercise_id": "wrist02",
            "name": "손목 돌리기",
            "sets": 3,
            "reps": 10,
            "video_url": "https://youtube.com/watch?v=def456"
          }
        ]
      }
    ],
    "created_at": "2026-02-25T11:05:15Z"
  }
}
```

---

### 5.2 운동 라이브러리 조회

**Endpoint:** `GET /rehab/exercises`

**Query Parameters:**
- `target_area`: 무릎, 허리, 어깨, 손목 등
- `difficulty`: low, medium, high

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "exercises": [
      {
        "exercise_id": "knee01",
        "name": "큐세팅",
        "target_area": "무릎",
        "difficulty": "low",
        "contraindications": [],
        "video_url": "https://youtube.com/watch?v=knee01",
        "instructions": "1. 바닥에 다리를 쭉 펴고 앉습니다.\n2. 무릎 뒤를 바닥에 누르듯이 힘을 줍니다.\n3. 5초 유지 후 이완합니다.",
        "tags": ["diabetes_safe", "hypertension_safe", "osteoporosis_safe"]
      },
      {
        "exercise_id": "knee02",
        "name": "SLR (다리 들기)",
        "target_area": "무릎",
        "difficulty": "medium",
        "contraindications": ["급성통증"],
        "video_url": "https://youtube.com/watch?v=knee02",
        "tags": ["diabetes_safe", "hypertension_safe"]
      }
    ]
  }
}
```

### 5.3 운동 완료 체크

**Endpoint:** `POST /rehab/exercises/{exercise_id}/complete`

**설명:** 사용자가 운동을 완료했을 때 기록합니다. 순응도 관리에 사용됩니다.

**Request Body:**
```json
{
  "actual_sets": 3,
  "actual_reps": 10,
  "pain_level": 3,
  "notes": "무릎이 조금 아팠지만 완료했습니다."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "completion_id": 456,
    "rehab_exercise_id": 123,
    "completed_at": "2026-02-25T14:30:00Z",
    "actual_sets": 3,
    "actual_reps": 10,
    "pain_level": 3
  },
  "message": "운동 완료가 기록되었습니다."
}
```

**비즈니스 로직:**

- 같은 운동을 하루에 여러 번 완료 가능
- pain_level > 7이면 경고 알림 발송
- 주간 순응도 계산: 완료한 운동 수 / 계획된 운동 수 * 100

---

## 6. 챗봇 (Chatbot)

---

### 6.0 활성 세션 조회 (이어하기)

**Endpoint:** `GET /chat/sessions/active`

**설명:** 현재 사용자의 활성 세션(ACTIVE 상태)을 조회합니다. 새로고침 후 대화를 이어갈 때 사용합니다.

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
    "started_at": "2026-02-25T12:00:00Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "활성 세션이 없습니다. 새로운 세션을 시작해주세요."
}
```

**프론트엔드 로직:**
```json
// 챗봇 페이지 진입 시
try {
  const session = await getActiveSession();
  loadMessages(session.session_id);
} catch (404) {
  const newSession = await createSession();
}
```

**비즈니스 로직:**
- session_status='ACTIVE'인 가장 최근 세션 반환
- 활성 세션이 없으면 404 반환
- 프론트엔드는 404 받으면 POST /chat/sessions로 새 세션 시작
- UX 개선: 사용자가 새로고침해도 대화 맥락 유지

### 6.1 챗봇 세션 시작

**Endpoint:** `POST /chat/sessions`

**설명:** 새로운 챗봇 세션을 시작합니다. 컨텍스트 유형에 따라 관련 정보를 함께 전달합니다.

**Request Body:**
```json
{
  "context_type": "GUIDE",  // "GUIDE", "EXERCISE", "GENERAL" 중 하나
  "context_id": 789         // guide_result_id 또는 rehab_exercise_id (GENERAL일 경우 null)
}
```

**Request Body 설명:**
- context_type: 대화 컨텍스트 유형
  - GUIDE: 분석 결과에 대한 질문
  - EXERCISE: 특정 운동에 대한 질문
  - GENERAL: 일반 건강 상담
- context_id: 컨텍스트 ID
  - context_type='GUIDE': guide_result_id
  - context_type='EXERCISE': rehab_exercise_id
  - context_type='GENERAL': null

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "session_id": 201,
    "context_type": "GUIDE",
    "context_id": 789,
    "session_status": "ACTIVE",
    "started_at": "2026-02-25T12:00:00Z"
  },
  "message": "챗봇 세션이 시작되었습니다."
}
```

**비즈니스 로직:**
- context_type='GUIDE': 해당 가이드 전체 정보를 LLM 프롬프트에 주입
- context_type='EXERCISE': 해당 운동 정보만 프롬프트에 주입 (토큰 절약)
- context_type='GENERAL': 컨텍스트 없이 일반 대화
- 30분 이상 입력 없으면 자동으로 session_status='CLOSED'로 변경

---

### 6.2 메시지 전송

**Endpoint:** `POST /chat/sessions/{session_id}/messages`

**Request Body:**
```json
{
  "message": "트라마돌 먹으면 어지러운데 운동해도 되나요?"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message_id": 301,
    "session_id": 201,
    "user_message": "트라마돌 먹으면 어지러운데 운동해도 되나요?",
    "assistant_message": "트라마돌은 어지러움을 유발할 수 있습니다.\n\n골다공증 환자분께서는 낙상 위험이 높으므로, 약 복용 후 30분간은 운동을 피하시고, 바닥에 앉아서 하는 운동(큐세팅, 손목 굽히기)을 권장합니다.\n\n⚠️ 이 정보는 참고용이며, 정확한 진단과 치료는 담당 의사와 상담하세요.",
    "created_at": "2026-02-25T12:01:00Z"
  }
}
```

**면책 조항:**
- 모든 응답에 "⚠️ 이 정보는 참고용이며, 정확한 진단과 치료는 담당 의사와 상담하세요." 문구 필수 포함

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
        "created_at": "2026-02-25T12:00:30Z"
      },
      {
        "message_id": 302,
        "role": "assistant",
        "content": "트라마돌은 어지러움을 유발할 수 있습니다...",
        "created_at": "2026-02-25T12:01:00Z"
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
    "ended_at": "2026-02-25T12:30:00Z"
  },
  "message": "챗봇 세션이 종료되었습니다."
}
```

---

## 7. 피드백 (Feedbacks)

---
### 7.1 피드백 전송

**Endpoint:** `POST /feedbacks`

**설명:** 챗봇 답변, 분석 결과, 운동에 대한 좋아요/싫어요 피드백을 전송합니다. (REQ-019 대응)

**Request Body:**
```json
{
  "target_type": "CHAT",   // "CHAT", "GUIDE", "EXERCISE"
  "target_id": 302,        // message_id, guide_result_id, exercise_id
  "rating": 1,             // 1 (좋아요), 0 (싫어요)
  "comment": "설명이 너무 어려워요" // 선택 사항
}
```

**Request Body 설명:**
- target_type: 피드백 대상 유형
  - CHAT: 챗봇 메시지
  - GUIDE: 분석 결과
  - EXERCISE: 운동 추천
- target_id: 대상 ID
  - target_type='CHAT': message_id
  - target_type='GUIDE': guide_result_id
  - target_type='EXERCISE': exercise_id
- rating: 평가
  - 1: 좋아요 👍
  - 0: 싫어요 👎
- comment: 추가 코멘트 (선택 사항)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "피드백이 반영되었습니다."
}
```

**비즈니스 로직:**
- 모든 챗봇 응답에 좋아요/싫어요 버튼 표시
- rating=0인 응답은 프롬프트 개선 데이터로 활용
- 발표 때 "평균 만족도 85%" 같은 데이터 제시 가능
- 심사위원에게 "지속적인 모델 성능 검증" 증명 (REQ-019)

---

## 8. 공통 응답 형식

### 8.1 성공 응답

```json
{
  "success": true,
  "data": { ... },
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

## ⚠9. 에러 코드

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
| `OCR_001` | 400 | 파일 용량 초과 | 10MB 이하 파일 사용 |
| `OCR_002` | 400 | 파일 형식 오류 | JPEG/PNG 파일 사용 |
| `OCR_003` | 500 | OCR 처리 실패 | 재시도 또는 수동 입력 |
| `OCR_004` | 400 | 신뢰도 낮음 | OCR 결과 수정 필요 |

### 9.3 AI 분석 관련 (LLM)

| 코드 | HTTP | 설명 | 해결 방법 |
|:---:|:---:|:---|:---|
| `LLM_001` | 500 | LLM API 호출 실패 | 재시도 |
| `LLM_002` | 500 | 응답 형식 오류 | 재시도 |
| `LLM_003` | 504 | 타임아웃 (30초 초과) | 재시도 |

### 9.4 일반 오류 (COMMON)

| 코드 | HTTP | 설명 | 해결 방법 |
|:---:|:---:|:---|:---|
| `COMMON_001` | 400 | 필수 필드 누락 | 요청 데이터 확인 |
| `COMMON_002` | 404 | 리소스를 찾을 수 없음 | ID 확인 |
| `COMMON_003` | 500 | 서버 내부 오류 | 관리자 문의 |

---

## 10. 비동기 작업 처리

### 10.1 작업 상태 조회

**Endpoint:** `GET /tasks/{task_id}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "task_id": "abc123",
    "status": "PROCESSING",
    "progress": 60,
    "message": "약물 상호작용 분석 중...",
    "created_at": "2026-02-25T11:05:00Z"
  }
}
```

**Status:**
- `PENDING`: 대기 중
- `PROCESSING`: 처리 중
- `COMPLETED`: 완료
- `FAILED`: 실패

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
    "items": [ ... ],
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

### 12.2 CORS 설정
```
허용 Origin: http://localhost:3000 (개발)
허용 Method: GET, POST, PUT, DELETE
허용 Header: Authorization, Content-Type
```

### 12.3 Rate Limiting
```
일반 API: 100 requests/minute
OCR API: 10 requests/minute
챗봇 API: 30 requests/minute
```

---

## 13. 개발 우선순위

### Phase 1 (Day 3-5) - 필수
```
 POST /auth/register
 POST /auth/login
 POST /profile/health
 POST /profile/chronic-conditions
 POST /profile/medications
 POST /documents/upload
 GET /documents/{id}/ocr
 PUT /documents/{id}/ocr
 POST /documents/{id}/analyze
 GET /analysis/{id}
```

### Phase 2 (Day 6-9) - 중요
```
 GET /profile
 GET /rehab/{id}
 POST /chat/sessions
 POST /chat/sessions/{id}/messages
 GET /chat/sessions/{id}/messages
```

### Phase 3 (Day 10-12) - 선택
```
 GET /analysis (목록)
 GET /rehab/exercises (라이브러리)
 POST /auth/refresh
```

---
