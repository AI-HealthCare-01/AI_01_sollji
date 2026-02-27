# ChronicCare Ortho API 명세서

**문서 버전:** v1.1  
**작성일:** 2026-02-25  
**최종 수정:** 2026-02-27 (백엔드 구현 기준 동기화)  
**Base URL:** `http://localhost:8000/api/v1`  
**인증 방식:** JWT Bearer Token  
**응답 형식:** JSON

**문서 변경 이력:**
- v1.0 (2026-02-25): 초기 작성 (개발 시작 전)
- v1.1 (2026-02-27): 백엔드 실제 구현 기준으로 경로/메서드 동기화. MVP 미구현 항목 Phase 2 표시.

---

## 목차

### 1. 인증 (Authentication)
- 1.1 회원가입
- 1.2 로그인
- 1.3 내 정보 조회
- 1.4 토큰 갱신 ⚠️ Phase 2

### 2. 사용자 프로필 (User Profile)
- 2.1 건강 프로필 등록/수정
- 2.2 전체 프로필 조회
- 2.3 만성질환 목록 조회
- 2.4 만성질환 등록
- 2.5 만성질환 삭제
- 2.6 복용 약물 목록 조회
- 2.7 복용 약물 등록
- 2.8 복용 약물 삭제
- 2.9 알러지 목록 조회
- 2.10 알러지 등록
- 2.11 알러지 삭제
- 2.12 약물 검색 (자동완성) ⚠️ Phase 2

### 3. 문서 및 OCR (Documents & OCR)
- 3.1 처방전 업로드 (OCR 자동 실행)
- 3.2 문서 및 OCR 결과 조회
- 3.3 OCR 결과 수정 ⚠️ Phase 2
- 3.4 분석 요청

### 4. AI 분석 (AI Analysis)
- 4.1 분석 상태 및 결과 조회
- 4.2 분석 결과 목록 조회 ⚠️ Phase 2

### 5. 재활 운동 (Rehabilitation)
- 5.1 재활 계획 목록 조회
- 5.2 재활 계획 상세 조회
- 5.3 운동 완료 체크
- 5.4 재활 진행률 조회
- 5.5 운동 라이브러리 조회

### 6. 챗봇 (Chatbot)
- 6.1 메시지 전송 (세션 자동 생성)
- 6.2 채팅 세션 목록 조회
- 6.3 대화 이력 조회
- 6.4 세션 종료
- 6.5 활성 세션 조회 ⚠️ Phase 2

### 7. 피드백 (Feedbacks)
- 7.1 피드백 전송
- 7.2 피드백 목록 조회

### 8. 공통 응답 형식
### 9. 에러 코드
### 10. 비동기 작업 처리
### 11. 보안
### 12. 개발 우선순위

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

> `expires_in`은 86400초 (24시간). 리프레시 토큰 없이 24시간 유효 토큰으로 단순화.

**Error Cases:**
- `401`: 이메일 또는 비밀번호 오류
- `400`: 필수 필드 누락

---

### 1.3 내 정보 조회

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "김영희",
    "created_at": "2026-02-25T10:30:00Z"
  }
}
```

---

### 1.4 토큰 갱신 ⚠️ Phase 2 구현 예정

**Endpoint:** `POST /auth/refresh`

> MVP에서는 24시간 유효 토큰으로 대체. 프론트엔드 완성 후 UX 개선 시 구현 예정.

---

## 2. 사용자 프로필 (User Profile)

> MVP 구현 방식: 목록 전체 교체(PUT) 대신 개별 등록/삭제(POST + DELETE)로 구현.  
> 전체 교체 방식(PUT)은 Phase 2에서 프론트엔드 UX에 맞춰 추가 예정.

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

### 2.2 전체 프로필 조회

**Endpoint:** `GET /profile/me`

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
        "id": 1,
        "condition_type": "당뇨",
        "diagnosed_date": "2019-05-10"
      }
    ],
    "medications": [
      {
        "id": 1,
        "medication_name": "메트포르민정500mg",
        "dosage": "500mg",
        "frequency": 2,
        "timing": ["morning", "evening"],
        "medication_type": "CHRONIC"
      }
    ],
    "allergies": [
      {
        "id": 1,
        "allergen_name": "페니실린",
        "severity": "중증"
      }
    ]
  }
}
```

---

### 2.3 만성질환 목록 조회

**Endpoint:** `GET /profile/conditions`

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
        "severity": "중등도",
        "notes": "인슐린 치료 중"
      },
      {
        "id": 2,
        "condition_type": "골다공증",
        "diagnosed_date": "2021-08-15",
        "severity": "경증"
      }
    ]
  }
}
```

---

### 2.4 만성질환 등록

**Endpoint:** `POST /profile/conditions`

**Request Body:**
```json
{
  "condition_type": "당뇨",
  "diagnosed_date": "2019-05-10",
  "severity": "중등도",
  "notes": "인슐린 치료 중"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "condition_type": "당뇨",
    "diagnosed_date": "2019-05-10",
    "severity": "중등도"
  },
  "message": "만성질환이 등록되었습니다."
}
```

**Validation:**
- `condition_type`: "당뇨", "고혈압", "골다공증" 중 하나
- `severity`: "경증", "중등도", "중증" 중 하나

---

### 2.5 만성질환 삭제

**Endpoint:** `DELETE /profile/conditions/{id}`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "만성질환이 삭제되었습니다."
}
```

---

### 2.6 복용 약물 목록 조회

**Endpoint:** `GET /profile/medications`

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
        "is_active": true
      }
    ]
  }
}
```

---

### 2.7 복용 약물 등록

**Endpoint:** `POST /profile/medications`

**Request Body:**
```json
{
  "medication_name": "메트포르민정500mg",
  "standardized_name": "메트포르민",
  "ingredient": "Metformin",
  "dosage": "500mg",
  "frequency": 2,
  "timing": ["morning", "evening"],
  "medication_type": "CHRONIC"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "medication_name": "메트포르민정500mg",
    "dosage": "500mg",
    "frequency": 2,
    "timing": ["morning", "evening"],
    "medication_type": "CHRONIC",
    "is_active": true,
    "created_at": "2026-02-26T10:00:00Z"
  },
  "message": "복용 약물이 등록되었습니다."
}
```

**Validation:**
- `frequency`: 1~4 사이의 정수
- `timing`: ["morning", "lunch", "evening", "bedtime"] 중 선택
- `medication_type`: "CHRONIC" 또는 "NEW"

---

### 2.8 복용 약물 삭제

**Endpoint:** `DELETE /profile/medications/{id}`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "복용 약물이 삭제되었습니다."
}
```

---

### 2.9 알러지 목록 조회

**Endpoint:** `GET /profile/allergies`

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
  }
}
```

---

### 2.10 알러지 등록

**Endpoint:** `POST /profile/allergies`

**Request Body:**
```json
{
  "allergen_name": "페니실린",
  "allergen_type": "약물",
  "severity": "중증",
  "reaction_description": "두드러기, 호흡곤란"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "allergen_name": "페니실린",
    "allergen_type": "약물",
    "severity": "중증"
  },
  "message": "알러지 정보가 등록되었습니다."
}
```

---

### 2.11 알러지 삭제

**Endpoint:** `DELETE /profile/allergies/{id}`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "알러지 정보가 삭제되었습니다."
}
```

---

### 2.12 약물 검색 (자동완성) ⚠️ Phase 2 구현 예정

**Endpoint:** `GET /medications/search`

> 프론트엔드 자동완성 UI 구현 시 함께 개발 예정.

**Query Parameters:**
- `q`: 검색어 (최소 2자)
- `limit`: 결과 개수 (default: 10)

**Validation:**
- `q`: 최소 2자, 최대 50자
- `limit`: 1~50 사이

---

## 3. 문서 및 OCR (Documents & OCR)

### 3.1 처방전 업로드 (OCR 자동 실행)

**Endpoint:** `POST /documents/upload`

> 업로드와 동시에 OCR이 자동 실행됩니다.

**Request (multipart/form-data):**
```
file: (binary)
document_type: "PRESCRIPTION"
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
- 파일 형식: JPEG, PNG (최대 10MB)
- `document_type`: "PRESCRIPTION", "MEDICINE_BAG", "TEST_RESULT" 중 하나

**Error Cases:**
- `400`: 파일 형식 오류
- `413`: 파일 용량 초과 (10MB)

---

### 3.2 문서 및 OCR 결과 조회

**Endpoint:** `GET /documents/{document_id}`

> 문서 정보와 OCR 결과를 함께 반환합니다.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "document_id": 123,
    "file_url": "http://localhost:8000/static/uploads/1_20260225_prescription.jpg",
    "processing_status": "SUCCESS",
    "ocr_result": {
      "ocr_result_id": 456,
      "confidence_score": 0.92,
      "hospital_name": "서울대학교병원",
      "prescribed_date": "2026-02-20",
      "medications": [
        {
          "name": "트라마돌",
          "dosage": "50mg",
          "frequency": 3,
          "timing": ["morning", "lunch", "evening"],
          "confidence": 0.95
        }
      ],
      "is_confirmed": false,
      "created_at": "2026-02-25T11:00:05Z"
    }
  }
}
```

**Processing Status:**
- `PENDING`: OCR 처리 중
- `SUCCESS`: 완료
- `FAILED`: 실패

---

### 3.3 OCR 결과 수정 ⚠️ Phase 2 구현 예정

**Endpoint:** `PUT /documents/{document_id}/ocr`

> OCR 인식 오류를 수동으로 수정하는 기능. 프론트엔드 편집 UI 구현 시 함께 개발 예정.

---

### 3.4 분석 요청

**Endpoint:** `POST /analysis/{document_id}`

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "guide_result_id": 789,
    "status": "PROCESSING",
    "estimated_time": "30-60초"
  },
  "message": "분석이 시작되었습니다. 잠시만 기다려주세요."
}
```

**비동기 처리:**
- 202 Accepted 즉시 반환
- 프론트엔드는 `GET /analysis/{guide_result_id}/status`를 2초마다 폴링
- `status: "COMPLETED"` 확인 후 전체 결과 표시

---

## 4. AI 분석 (AI Analysis)

### 4.1 분석 상태 및 결과 조회

**Endpoint:** `GET /analysis/{guide_result_id}/status`

> 분석 진행 중에는 status만 반환. 완료 시 전체 결과 포함.

**Response - 처리 중 (200 OK):**
```json
{
  "success": true,
  "data": {
    "guide_result_id": 789,
    "status": "PROCESSING"
  }
}
```

**Response - 완료 (200 OK):**
```json
{
  "success": true,
  "data": {
    "guide_result_id": 789,
    "status": "COMPLETED",
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
        "medications": ["메트포르민 500mg", "트라마돌 50mg", "세파클러 500mg"],
        "special_instructions": "물 한 컵(200ml)과 함께 복용"
      },
      {
        "time_slot": "점심 식후",
        "medications": ["트라마돌 50mg"]
      },
      {
        "time_slot": "저녁 식후",
        "medications": ["메트포르민 500mg", "트라마돌 50mg", "세파클러 500mg"]
      }
    ],
    "rehab_plan": {
      "rehab_plan_id": 101,
      "target_area": "손목",
      "duration_weeks": 4,
      "goal": "손목 가동범위 정상 회복 및 악력 강화",
      "precautions": "골다공증 환자이므로 무리한 하중 금지. 통증 발생 시 즉시 중단."
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

### 4.2 분석 결과 목록 조회 ⚠️ Phase 2 구현 예정

**Endpoint:** `GET /analysis`

> 분석 이력 페이지 구현 시 개발 예정.

---

## 5. 재활 운동 (Rehabilitation)

### 5.1 재활 계획 목록 조회

**Endpoint:** `GET /rehab/plans`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "rehab_plan_id": 101,
        "target_area": "손목",
        "duration_weeks": 4,
        "goal": "손목 가동범위 정상 회복 및 악력 강화",
        "created_at": "2026-02-25T11:05:15Z"
      }
    ]
  }
}
```

---

### 5.2 재활 계획 상세 조회

**Endpoint:** `GET /rehab/plans/{plan_id}`

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
      }
    ],
    "created_at": "2026-02-25T11:05:15Z"
  }
}
```

---

### 5.3 운동 완료 체크

**Endpoint:** `POST /rehab/plans/{plan_id}/exercises/{id}/complete`

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

---

### 5.4 재활 진행률 조회

**Endpoint:** `GET /rehab/plans/{plan_id}/progress`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "rehab_plan_id": 101,
    "total_exercises": 20,
    "completed_exercises": 8,
    "progress_percent": 40,
    "current_week": 2
  }
}
```

---

### 5.5 운동 라이브러리 조회

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
      }
    ]
  }
}
```

---

## 6. 챗봇 (Chatbot)

### 6.1 메시지 전송 (세션 자동 생성)

**Endpoint:** `POST /chat`

> 세션이 없으면 자동 생성 후 메시지 전송. 세션 생성과 메시지 전송이 단일 엔드포인트로 통합.

**Request Body:**
```json
{
  "message": "트라마돌 먹으면 어지러운데 운동해도 되나요?",
  "context_type": "GUIDE",
  "context_id": 789,
  "session_id": null
}
```

**Request Body 설명:**
- `session_id`: 기존 세션 이어가기 시 세션 ID 전달. 새 세션이면 `null`
- `context_type`: "GUIDE", "EXERCISE", "GENERAL" 중 하나
- `context_id`: context_type이 GENERAL이면 `null`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session_id": 201,
    "message_id": 301,
    "user_message": "트라마돌 먹으면 어지러운데 운동해도 되나요?",
    "assistant_message": "트라마돌은 어지러움을 유발할 수 있습니다.\n\n골다공증 환자분께서는 낙상 위험이 높으므로, 약 복용 후 30분간은 운동을 피하시고, 바닥에 앉아서 하는 운동(큐세팅, 손목 굽히기)을 권장합니다.\n\n⚠️ 이 정보는 참고용이며, 정확한 진단과 치료는 담당 의사와 상담하세요.",
    "created_at": "2026-02-25T12:01:00Z"
  }
}
```

**면책 조항:**
- 모든 응답에 "⚠️ 이 정보는 참고용이며, 정확한 진단과 치료는 담당 의사와 상담하세요." 문구 필수 포함

---

### 6.2 채팅 세션 목록 조회

**Endpoint:** `GET /chat/sessions`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "session_id": 201,
        "context_type": "GUIDE",
        "context_id": 789,
        "session_status": "ACTIVE",
        "started_at": "2026-02-25T12:00:00Z"
      }
    ]
  }
}
```

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

**Endpoint:** `PATCH /chat/sessions/{session_id}/end`

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

### 6.5 활성 세션 조회 ⚠️ Phase 2 구현 예정

**Endpoint:** `GET /chat/sessions/active`

> 새로고침 후 대화 이어가기 UX 구현 시 개발 예정.

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
  "comment": "설명이 너무 어려워요"
}
```

**Request Body 설명:**
- `target_type`: "CHAT", "GUIDE", "EXERCISE" 중 하나
- `target_id`: target_type에 따라 message_id / guide_result_id / exercise_id
- `rating`: 1 (좋아요), 0 (싫어요)
- `comment`: 선택 사항

**Response (201 Created):**
```json
{
  "success": true,
  "message": "피드백이 반영되었습니다."
}
```

---

### 7.2 피드백 목록 조회

**Endpoint:** `GET /feedbacks`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "feedback_id": 1,
        "target_type": "CHAT",
        "target_id": 302,
        "rating": 1,
        "comment": "설명이 너무 어려워요",
        "created_at": "2026-02-25T13:00:00Z"
      }
    ]
  }
}
```

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

## 9. 에러 코드

### 9.1 인증 관련 (AUTH)

| 코드 | HTTP | 설명 | 해결 방법 |
|:---:|:---:|:---|:---|
| `AUTH_001` | 401 | 토큰 만료 | 재로그인 필요 |
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

AI 분석(`POST /analysis/{document_id}`)은 비동기로 처리됩니다.

**폴링 방법:**
1. `POST /analysis/{document_id}` → `guide_result_id` 수신
2. `GET /analysis/{guide_result_id}/status`를 2초마다 폴링
3. `status: "COMPLETED"` 확인 시 결과 표시

**Status 값:**
- `PENDING`: 대기 중
- `PROCESSING`: 처리 중
- `COMPLETED`: 완료
- `FAILED`: 실패

---

## 11. 보안

### 11.1 인증 헤더
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 11.2 CORS 설정
```
허용 Origin: http://localhost:3000 (개발)
허용 Method: GET, POST, PUT, PATCH, DELETE
허용 Header: Authorization, Content-Type
```

### 11.3 파일 업로드 제한
```
최대 용량: 10MB
허용 형식: JPEG, PNG
```

---

## 12. 개발 우선순위

### Phase 1 (완료) 
```
 POST /auth/register
 POST /auth/login
 GET  /auth/me
 POST /profile/health
 POST /profile/conditions
 GET  /profile/conditions
 DELETE /profile/conditions/{id}
 POST /profile/medications
 GET  /profile/medications
 DELETE /profile/medications/{id}
 POST /profile/allergies
 GET  /profile/allergies
 DELETE /profile/allergies/{id}
 GET  /profile/me
 POST /documents/upload
 GET  /documents/{document_id}
 POST /analysis/{document_id}
 GET  /analysis/{guide_result_id}/status
 GET  /rehab/plans
 GET  /rehab/plans/{plan_id}
 POST /rehab/plans/{plan_id}/exercises/{id}/complete
 GET  /rehab/plans/{plan_id}/progress
 GET  /rehab/exercises
 POST /chat
 GET  /chat/sessions
 GET  /chat/sessions/{session_id}/messages
 PATCH /chat/sessions/{session_id}/end
 POST /feedbacks
 GET  /feedbacks
```

### Phase 2 (프론트엔드 완성 후)
```
⬜ POST /auth/refresh              - 토큰 갱신
⬜ GET  /medications/search        - 약물 자동완성
⬜ PUT  /documents/{id}/ocr        - OCR 수정
⬜ GET  /analysis                  - 분석 이력 목록
⬜ GET  /chat/sessions/active      - 활성 세션 조회
⬜ GET  /notifications             - 알림 (테이블 설계 완료)
```
