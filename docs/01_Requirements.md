# ChronicCare AI 기능 요구사항 명세서 (Requirements Specification) - 웹 버전

**문서 버전:** v3.0 (실제 구현 기준 최종 정리)

**작성일:** 2026-03-20

**프로젝트명:** ChronicCare AI (만성질환자 맞춤형 통합 복약·재활 관리 시스템)

**문서 목적:** 각 기능의 상세 동작 방식, API 명세, UI 요구사항, 테스트 시나리오를 정의한다.

**문서 변경 이력:**
- v1.0 (2026-02-25): 초기 작성
- v2.0 (2026-02-26): 사용자 스토리, API 명세, UI 요구사항, 테스트 시나리오 추가
- v2.1 (2026-02-26): 웹 레이아웃으로 UI 섹션 재작성
- v3.0 (2026-03-20): 실제 구현 기준으로 전면 수정
  - API 경로 /v1 추가
  - S3 → 로컬 uploads/ 폴더로 변경
  - Celery → FastAPI BackgroundTasks로 변경
  - localStorage → sessionStorage (Zustand persist)로 변경
  - drug_normalizer.py 약물 표준화 방식 반영
  - Mock 모드 환경변수 추가
  - 챗봇 SSE 스트리밍 엔드포인트 분리 반영

---

## 목차

1. [사용자 스토리 (User Stories)](#1-사용자-스토리-user-stories)
2. [API 엔드포인트 명세](#2-api-엔드포인트-명세)
3. [화면별 UI 요구사항 (웹 레이아웃)](#3-화면별-ui-요구사항-웹-레이아웃)
4. [데이터 검증 규칙](#4-데이터-검증-규칙)
5. [권한 및 접근 제어](#5-권한-및-접근-제어)
6. [비기능적 요구사항 상세](#6-비기능적-요구사항-상세)
7. [테스트 시나리오](#7-테스트-시나리오)
8. [에러 코드 정의](#8-에러-코드-정의)

---

## 1. 사용자 스토리 (User Stories)

### 1.1 인증 (Authentication)

#### US-001: 회원가입

**As a** 만성질환 환자
**I want to** 이메일로 회원가입하고
**So that** 내 건강 정보를 안전하게 관리할 수 있다

**인수 기준 (Acceptance Criteria):**
- [ ] 이메일 형식 검증 (RFC 5322 표준)
- [ ] 비밀번호 8자 이상, 영문+숫자 포함
- [ ] 중복 이메일 체크 (실시간)
- [ ] 회원가입 성공 시 JWT 토큰 발급
- [ ] 회원가입 성공 시 자동 로그인
- [ ] 에러 발생 시 명확한 메시지 표시

**우선순위:** High
**예상 소요 시간:** 4시간

---

#### US-002: 로그인

**As a** 등록된 사용자
**I want to** 이메일과 비밀번호로 로그인하고
**So that** 내 건강 데이터에 접근할 수 있다

**인수 기준:**
- [ ] 이메일 + 비밀번호 검증
- [ ] 로그인 성공 시 JWT 토큰 발급 (유효기간 24시간)
- [ ] 토큰을 sessionStorage에 저장 (Zustand persist 미들웨어)
- [ ] 로그인 실패 시 "이메일 또는 비밀번호가 잘못되었습니다" 메시지
- [ ] 5회 연속 실패 시 5분간 로그인 차단 (선택 사항)

**우선순위:** High
**예상 소요 시간:** 3시간

---

#### US-003: 로그아웃

**As a** 로그인한 사용자
**I want to** 로그아웃 버튼을 클릭하고
**So that** 내 계정을 안전하게 보호할 수 있다

**인수 기준:**
- [ ] 로그아웃 버튼 클릭 시 sessionStorage에서 토큰 삭제 (Zustand store 초기화)
- [ ] 로그인 페이지로 리다이렉트
- [ ] 로그아웃 후 인증 필요 페이지 접근 시 로그인 페이지로 이동

**우선순위:** High
**예상 소요 시간:** 1시간

---

### 1.2 프로필 관리 (Profile Management)

#### US-004: 기저질환 입력

**As a** 신규 가입 사용자
**I want to** 내 기저질환(당뇨/고혈압/골다공증)을 선택하고
**So that** 맞춤형 분석을 받을 수 있다

**인수 기준:**
- [ ] 당뇨/고혈압/골다공증 중 복수 선택 가능
- [ ] 최소 1개 선택 필수
- [ ] 선택한 질환 DB에 저장
- [ ] 저장 성공 시 다음 단계(약물 입력)로 이동

**우선순위:** High
**예상 소요 시간:** 2시간

---

#### US-005: 기존 약물 입력

**As a** 사용자
**I want to** 현재 복용 중인 약물을 입력하고
**So that** 신규 처방약과의 상호작용을 체크할 수 있다

**인수 기준:**
- [ ] 약품명 자유 텍스트 입력 가능
- [ ] 용량 입력 (예: 500mg)
- [ ] 복용 시간 선택 (아침/점심/저녁/취침 전)
- [ ] 복용 횟수 선택 (1일 1~4회)
- [ ] 여러 약물 추가 가능 (+ 버튼)
- [ ] 입력한 약물 수정/삭제 가능
- [ ] 저장 시 `standardized_name`은 drug_normalizer.py가 자동 생성 (백엔드 처리)

**우선순위:** High
**예상 소요 시간:** 4시간

---

#### US-006: 알러지 정보 입력

**As a** 사용자
**I want to** 약물 알러지 정보를 입력하고
**So that** 알러지 유발 약물을 피할 수 있다

**인수 기준:**
- [ ] 알러지 약물명 입력 (자유 텍스트)
- [ ] 여러 알러지 추가 가능
- [ ] 선택 사항 (건너뛰기 가능)

**우선순위:** Medium
**예상 소요 시간:** 2시간

---

### 1.3 처방전 분석 (Prescription Analysis)

#### US-007: 처방전 이미지 업로드

**As a** 사용자
**I want to** 처방전 사진을 업로드하고
**So that** 자동으로 약물 정보를 인식받을 수 있다

**인수 기준:**
- [ ] 파일 드래그 앤 드롭 지원
- [ ] JPEG/PNG 파일만 허용
- [ ] 10MB 이하 파일만 허용
- [ ] 업로드 중 로딩 표시 (프로그레스 바)
- [ ] 업로드 성공 시 OCR 처리 자동 시작
- [ ] 업로드된 이미지는 로컬 uploads/ 폴더에 임시 저장 (24시간 후 자동 삭제)
- [ ] 업로드 실패 시 에러 메시지 + 재시도 버튼

**우선순위:** High
**예상 소요 시간:** 4시간

---

#### US-008: OCR 결과 확인 및 수정

**As a** 사용자
**I want to** OCR로 인식된 약물 정보를 확인하고 수정하고
**So that** 정확한 분석 결과를 받을 수 있다

**인수 기준:**
- [ ] OCR 신뢰도 점수 표시 (0~100%)
- [ ] 신뢰도에 따른 색상 표시 (초록 90%+, 노랑 70-90%, 빨강 70% 미만)
- [ ] 인식된 약물 리스트 표시 (약품명, 용량, 복용법)
- [ ] 각 약물마다 수정/삭제 버튼
- [ ] 수정 버튼 클릭 시 인라인 편집 또는 모달
- [ ] 약물 추가 버튼 (수동 입력)
- [ ] "분석 시작" 버튼

**우선순위:** High
**예상 소요 시간:** 6시간

---

#### US-009: 약물 상호작용 분석 결과 확인

**As a** 사용자
**I want to** 기존 약물과 신규 약물의 상호작용을 확인하고
**So that** 안전하게 약을 복용할 수 있다

**인수 기준:**
- [ ] 상호작용 위험도 표시 (High/Medium/Low)
- [ ] 위험도에 따른 색상 표시 (빨강/노랑/초록)
- [ ] 상호작용 원리 설명
- [ ] 권장사항 표시
- [ ] 상호작용이 없는 경우 "안전" 메시지
- [ ] 면책 문구 표시: "정확한 진단은 의사와 상담하세요"
- [ ] overall_safety_score 표시 (⚠️ 현재 항상 0, 계산 로직 미구현)

**우선순위:** High
**예상 소요 시간:** 4시간

---

#### US-010: 복약 시간표 확인

**As a** 사용자
**I want to** 시간대별 복약 시간표를 확인하고
**So that** 약 복용 시간을 헷갈리지 않을 수 있다

**인수 기준:**
- [ ] 아침/점심/저녁/취침 전 시간대별 구분
- [ ] 각 시간대에 복용할 약물 리스트
- [ ] 약물별 용량, 복용 방법 표시
- [ ] 특별 주의사항 표시 (예: "공복에 복용", "물 한 컵과 함께")
- [ ] schedule_date는 JSONB 타입으로 저장됨

**우선순위:** High
**예상 소요 시간:** 4시간

---

### 1.4 재활 운동 (Rehabilitation)

#### US-011: 맞춤 재활 운동 추천

**As a** 수술/시술 후 환자
**I want to** 내 기저질환을 고려한 재활 운동을 추천받고
**So that** 안전하게 회복할 수 있다

**인수 기준:**
- [ ] 수술 부위 입력 (무릎/손목/허리 등)
- [ ] 수술일 입력
- [ ] 기저질환 고려한 운동 추천 (GPT-4o-mini, temperature=0.2)
- [ ] 금기 운동 제외 (예: 골다공증 환자 → 낙상 위험 운동 제외)
- [ ] 주차별 운동 프로그램 (1~4주)
- [ ] 각 운동마다 세트/횟수 표시
- [ ] exercise_library (seed_exercises.sql로 사전 로딩)에서 운동 매핑
- [ ] 운동 영상 링크 제공 (유튜브)

**우선순위:** High
**예상 소요 시간:** 6시간

---

#### US-012: 운동 영상 시청

**As a** 사용자
**I want to** 각 운동의 시범 영상을 보고
**So that** 올바른 자세로 운동할 수 있다

**인수 기준:**
- [ ] 각 운동마다 "영상 보기" 버튼
- [ ] 버튼 클릭 시 새 탭에서 유튜브 영상 재생
- [ ] 영상 링크 없는 경우 "준비 중" 표시

**우선순위:** Medium
**예상 소요 시간:** 2시간

---

#### US-013: 운동 완료 기록

**As a** 사용자
**I want to** 완료한 운동을 체크하고
**So that** 진행 상황을 추적할 수 있다

**인수 기준:**
- [ ] 각 운동마다 체크박스
- [ ] 체크 시 exercise_completions 테이블에 저장 (completed_date 포함)
- [ ] 주차별 완료율 표시 (예: 3/5 완료)
- [ ] 완료한 운동 회색 처리

**우선순위:** Medium
**예상 소요 시간:** 3시간

---

### 1.5 챗봇 (Chatbot)

#### US-014: 챗봇 질문하기

**As a** 사용자
**I want to** 약물이나 재활에 대해 질문하고
**So that** 궁금증을 즉시 해결할 수 있다

**인수 기준:**
- [ ] 채팅 입력 필드 (하단 고정)
- [ ] 질문 전송 버튼
- [ ] 질문 전송 시 로딩 표시 (타이핑 애니메이션)
- [ ] SSE 스트리밍으로 실시간 답변 표시 (POST /api/v1/chat/stream)
- [ ] 답변에 면책 문구 자동 추가
- [ ] 이전 대화 내역 표시 (스크롤 가능)

**우선순위:** High
**예상 소요 시간:** 6시간

---

#### US-015: 컨텍스트 인식 챗봇

**As a** 사용자
**I want to** 현재 보고 있는 화면 정보를 기반으로 답변받고
**So that** 더 정확한 답변을 받을 수 있다

**인수 기준:**
- [ ] 사용자가 보는 화면 정보 자동 감지 (약물 분석 결과/재활 플랜)
- [ ] 해당 정보를 프롬프트에 직접 주입 (seed_knowledge.json + 분석 리포트)
- [ ] 예: "이부프로펜 먹으면 어지러운데 운동해도 되나요?" → 현재 복용 약물 + 재활 플랜 참고하여 답변

**우선순위:** Medium
**예상 소요 시간:** 4시간

---

#### US-016: 챗봇 피드백

**As a** 사용자
**I want to** 챗봇 답변에 좋아요/싫어요를 표시하고
**So that** 서비스 개선에 기여할 수 있다

**인수 기준:**
- [ ] 각 답변마다 👍 👎 버튼
- [ ] 버튼 클릭 시 feedbacks 테이블에 저장 (rating, latency_ms 포함)
- [ ] 클릭 후 버튼 비활성화 (중복 방지)
- [ ] 피드백 감사 메시지 표시

**우선순위:** High
**예상 소요 시간:** 2시간

---

### 1.6 대시보드 (Dashboard)

#### US-017: 안전 점수 확인

**As a** 사용자
**I want to** 메인 화면에서 내 안전 점수를 확인하고
**So that** 현재 상태를 한눈에 파악할 수 있다

**인수 기준:**
- [ ] overall_safety_score 표시
- [ ] ⚠️ 현재 항상 0으로 표시됨 (DB 컬럼 존재, 계산 로직 미구현)
- [ ] 점수에 따른 색상 (초록 80+, 노랑 60-80, 빨강 60 미만)
- [ ] 점수 클릭 시 상세 설명 모달

**우선순위:** Low
**예상 소요 시간:** 3시간

---

#### US-018: 분석 이력 조회

**As a** 사용자
**I want to** 과거 분석 리포트를 조회하고
**So that** 이전 처방 내역을 확인할 수 있다

**인수 기준:**
- [ ] 날짜별 분석 리포트 리스트
- [ ] 최신순 정렬
- [ ] 각 리포트마다 날짜, 약물 개수, 상호작용 개수 표시
- [ ] 리포트 클릭 시 상세 페이지로 이동

**우선순위:** Medium
**예상 소요 시간:** 3시간

---

## 2. API 엔드포인트 명세

> ℹ️ 모든 엔드포인트는 `/api/v1` 접두사를 사용한다.

### 2.1 인증 (Authentication)

#### POST /api/v1/auth/register

**설명:** 회원가입

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "홍길동",
  "birth_date": "1990-01-01",
  "gender": "male",
  "phone": "010-1234-5678"
}
```

**Response (201 Created):**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "name": "홍길동",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

**Error Responses:**

**400 Bad Request (이메일 형식 오류):**
```json
{
  "error_code": "AUTH_001",
  "message": "이메일 형식이 올바르지 않습니다"
}
```

**400 Bad Request (비밀번호 길이 부족):**
```json
{
  "error_code": "AUTH_002",
  "message": "비밀번호는 8자 이상이어야 합니다"
}
```

**409 Conflict (중복 이메일):**
```json
{
  "error_code": "AUTH_003",
  "message": "이미 가입된 이메일입니다"
}
```

---

#### POST /api/v1/auth/login

**설명:** 로그인

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "name": "홍길동",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

**Error Responses:**

**401 Unauthorized (로그인 실패):**
```json
{
  "error_code": "AUTH_004",
  "message": "이메일 또는 비밀번호가 잘못되었습니다"
}
```

---

#### GET /api/v1/auth/me

**설명:** 현재 로그인한 사용자 정보 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "name": "홍길동",
  "birth_date": "1990-01-01",
  "gender": "male",
  "phone": "010-1234-5678",
  "created_at": "2026-02-25T10:00:00Z"
}
```

---

#### PATCH /api/v1/auth/me

**설명:** 회원 정보 수정

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "name": "홍길동",
  "phone": "010-9876-5432"
}
```

**Response (200 OK):**
```json
{
  "message": "회원 정보가 수정되었습니다"
}
```

---

#### PATCH /api/v1/auth/me/password

**설명:** 비밀번호 변경

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "current_password": "Password123!",
  "new_password": "NewPassword456!"
}
```

**Response (200 OK):**
```json
{
  "message": "비밀번호가 변경되었습니다"
}
```

---

#### DELETE /api/v1/auth/me

**설명:** 회원 탈퇴

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "message": "회원 탈퇴가 완료되었습니다"
}
```

---

### 2.2 프로필 (Profile)

#### POST /api/v1/profile/conditions

**설명:** 기저질환 입력

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "conditions": ["diabetes", "osteoporosis"]
}
```

**Response (201 Created):**
```json
{
  "message": "기저질환이 저장되었습니다",
  "conditions": [
    {
      "id": 1,
      "condition_type": "diabetes",
      "display_name": "당뇨"
    },
    {
      "id": 2,
      "condition_type": "osteoporosis",
      "display_name": "골다공증"
    }
  ]
}
```

---

#### POST /api/v1/profile/medications

**설명:** 기존 복용 약물 입력

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "medications": [
    {
      "medication_name": "메트포르민정500mg",
      "dosage": "500mg",
      "frequency": 2,
      "timing": ["morning", "evening"]
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "약물 정보가 저장되었습니다",
  "medications": [
    {
      "id": 1,
      "medication_name": "메트포르민정500mg",
      "standardized_name": "메트포르민",
      "dosage": "500mg",
      "frequency": 2,
      "timing": ["morning", "evening"],
      "is_active": true
    }
  ]
}
```

> ℹ️ `standardized_name`은 drug_normalizer.py (GPT-4o-mini, temperature=0)가 자동 생성한다.

---

#### GET /api/v1/profile

**설명:** 사용자 프로필 전체 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동"
  },
  "chronic_conditions": [
    {
      "id": 1,
      "condition_type": "diabetes",
      "display_name": "당뇨"
    }
  ],
  "medications": [
    {
      "id": 1,
      "medication_name": "메트포르민",
      "standardized_name": "메트포르민",
      "dosage": "500mg",
      "frequency": 2,
      "timing": ["morning", "evening"],
      "is_active": true
    }
  ],
  "allergies": [
    {
      "id": 1,
      "allergen_name": "페니실린"
    }
  ]
}
```

---

### 2.3 문서 및 OCR (Documents & OCR)

#### POST /api/v1/documents/upload

**설명:** 처방전 이미지 업로드 및 OCR 처리

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Request:**
```
file: [이미지 파일]
```

**Response (200 OK):**
```json
{
  "ocr_result_id": 123,
  "document_id": 456,
  "confidence_score": 0.92,
  "image_path": "/uploads/abc123.jpg",
  "medications": [
    {
      "name": "이부프로펜정",
      "dosage": "400mg",
      "frequency": "1일 3회",
      "timing": "식후",
      "confidence": 0.95
    }
  ],
  "processing_time_ms": 4523
}
```

> ℹ️ 이미지는 로컬 `uploads/` 폴더에 저장되며 24시간 후 자동 삭제된다. S3 미사용.

**Error Responses:**

**400 Bad Request (파일 크기 초과):**
```json
{
  "error_code": "OCR_001",
  "message": "이미지 용량은 10MB 이하여야 합니다"
}
```

**400 Bad Request (파일 형식 오류):**
```json
{
  "error_code": "OCR_002",
  "message": "JPEG 또는 PNG 파일만 가능합니다"
}
```

**500 Internal Server Error (OCR 실패):**
```json
{
  "error_code": "OCR_003",
  "message": "인식 실패. 직접 입력해주세요"
}
```

---

#### PATCH /api/v1/documents/ocr/{ocr_result_id}

**설명:** OCR 결과 수정

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "medications": [
    {
      "name": "이부프로펜정",
      "dosage": "400mg",
      "frequency": "1일 3회",
      "timing": "식후"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "OCR 결과가 수정되었습니다",
  "ocr_result_id": 123
}
```

---

### 2.4 분석 (Analysis)

#### POST /api/v1/analysis/{document_id}

**설명:** 약물 상호작용 분석 및 재활 가이드 생성 시작 (비동기)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "target_area": "knee",
  "surgery_date": "2026-02-01"
}
```

**Response (202 Accepted):**
```json
{
  "guide_result_id": 789,
  "status": "pending",
  "message": "분석이 시작되었습니다. 잠시만 기다려주세요."
}
```

> ℹ️ FastAPI BackgroundTasks로 비동기 처리. 즉시 202 반환 후 백그라운드에서 분석 진행.

---

#### GET /api/v1/analysis/{guide_result_id}/status

**설명:** 분석 작업 상태 조회 (폴링용)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK - 진행 중):**
```json
{
  "guide_result_id": 789,
  "status": "pending"
}
```

**Response (200 OK - 완료):**
```json
{
  "guide_result_id": 789,
  "status": "completed",
  "drug_interactions": [
    {
      "medication_a": "메트포르민",
      "medication_b": "이부프로펜",
      "severity": "medium",
      "mechanism": "신장 기능 저하 위험",
      "recommendation": "복용 중 신장 기능 체크"
    }
  ],
  "medication_schedules": [
    {
      "schedule_date": {
        "morning": ["메트포르민 500mg", "이부프로펜 400mg"],
        "evening": ["메트포르민 500mg"]
      }
    }
  ],
  "overall_safety_score": 0
}
```

> ⚠️ `overall_safety_score`는 DB 컬럼 존재, API 응답에 포함되나 항상 0. 계산 로직 미구현.

**Response (200 OK - 실패):**
```json
{
  "guide_result_id": 789,
  "status": "failed",
  "error_code": "LLM_001",
  "message": "분석 중 오류 발생. 다시 시도해주세요"
}
```

---

#### GET /api/v1/analysis/history

**설명:** 분석 이력 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "results": [
    {
      "guide_result_id": 789,
      "created_at": "2026-02-25T10:30:00Z",
      "status": "completed",
      "medication_count": 5,
      "interaction_count": 2
    }
  ]
}
```

---

### 2.5 재활 (Rehabilitation)

#### GET /api/v1/rehab/plans

**설명:** 재활 플랜 목록 조회 (Redis 캐싱 적용)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "plans": [
    {
      "id": 101,
      "target_area": "무릎",
      "is_active": true,
      "created_at": "2026-02-25T10:30:00Z"
    }
  ]
}
```

---

#### GET /api/v1/rehab/plans/{plan_id}/progress

**설명:** 재활 진행률 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "plan_id": 101,
  "current_week": 2,
  "total_weeks": 4,
  "completed_exercises": 8,
  "total_exercises": 15,
  "completion_rate": 0.53
}
```

---

### 2.6 챗봇 (Chatbot)

#### POST /api/v1/chat

**설명:** 챗봇 세션 생성 및 일반 응답

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "context_type": "guide_result",
  "context_id": 789,
  "message": "이부프로펜 먹으면 어지러운데 운동해도 되나요?"
}
```

**Response (200 OK):**
```json
{
  "session_id": "session-abc-123",
  "message_id": "msg-abc-123",
  "role": "assistant",
  "content": "이부프로펜은 어지러움을 유발할 수 있습니다...",
  "created_at": "2026-02-25T11:01:00Z",
  "latency_ms": 2341
}
```

---

#### POST /api/v1/chat/stream

**설명:** 챗봇 SSE 스트리밍 응답 (별도 엔드포인트)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "session_id": "session-abc-123",
  "message": "큐세팅은 어떻게 하나요?"
}
```

**Response: SSE 스트리밍**
```
data: {"chunk": "큐세팅은"}\n\n
data: {"chunk": " 무릎 재활의"}\n\n
data: {"chunk": " 기본 운동입니다."}\n\n
data: {"done": true}\n\n
```

---

#### GET /api/v1/chat/sessions

**설명:** 채팅 세션 목록 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "session_id": "session-abc-123",
      "context_type": "guide_result",
      "context_id": 789,
      "session_status": "active",
      "created_at": "2026-02-25T11:00:00Z"
    }
  ]
}
```

---

#### GET /api/v1/chat/sessions/{session_id}/messages

**설명:** 채팅 세션 메시지 이력 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "session_id": "session-abc-123",
  "messages": [
    {
      "message_id": "msg-001",
      "role": "user",
      "content": "이부프로펜 먹으면 어지러운데 운동해도 되나요?",
      "created_at": "2026-02-25T11:00:30Z"
    },
    {
      "message_id": "msg-002",
      "role": "assistant",
      "content": "이부프로펜은 어지러움을 유발할 수 있습니다...",
      "created_at": "2026-02-25T11:01:00Z"
    }
  ]
}
```

---

#### PATCH /api/v1/chat/sessions/{session_id}/end

**설명:** 채팅 세션 종료

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "message": "세션이 종료되었습니다"
}
```

---

### 2.7 피드백 (Feedback)

#### POST /api/v1/feedback

**설명:** 피드백 제출 (챗봇 응답, 분석 결과, 재활 플랜 모두 이 엔드포인트 사용)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request:**
```json
{
  "target_type": "chat_message",
  "target_id": 123,
  "rating": 5,
  "latency_ms": 2341
}
```

**Response (201 Created):**
```json
{
  "message": "피드백이 저장되었습니다. 감사합니다!"
}
```

---

#### GET /api/v1/feedback

**설명:** 피드백 목록 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "feedbacks": [
    {
      "id": 1,
      "target_type": "chat_message",
      "target_id": 123,
      "rating": 5,
      "latency_ms": 2341,
      "created_at": "2026-02-25T11:05:00Z"
    }
  ]
}
```

---

## 6. 비기능적 요구사항 상세
### 6.1 성능

| 항목 | 목표 | 측정 방법 |
|------|------|----------|
| 페이지 로딩 | 2초 이내 | Lighthouse Performance Score 90+ |
| OCR 처리 | 5초 이내 | 평균 응답 시간 (10회 측정) |
| AI 분석 완료 | 30초 이내 (비동기) | BackgroundTasks 완료 시간 |
| 챗봇 첫 청크 | 2초 이내 | SSE 첫 chunk 수신 시간 |
| API 일반 응답 | 200ms 이내 | 평균 응답 시간 |
| 재활 플랜 조회 | 200ms 이내 | Redis 캐싱 적용 (TTL 1시간) |

---

### 6.2 접근성 (WCAG 2.1 AA 기준)

| 항목 | 기준 | 검수 방법 |
|------|------|----------|
| 색상 대비 | 4.5:1 (일반 텍스트), 3:1 (큰 텍스트) | Chrome DevTools Contrast Checker |
| 키보드 네비게이션 | 모든 기능 Tab 키로 접근 가능 | 수동 테스트 |
| 포커스 표시 | 포커스된 요소에 명확한 아웃라인 | 시각적 확인 |
| 대체 텍스트 | 모든 이미지에 alt 속성 | HTML 검증 |
| ARIA 레이블 | 버튼·링크에 aria-label 제공 | HTML 검증 |
| 폰트 크기 | 최소 16px | Chrome DevTools 측정 |
| 터치 타겟 | 최소 44x44px | Chrome DevTools 측정 |

---

### 6.3 보안

| 항목 | 요구사항 | 구현 방법 |
|------|----------|----------|
| 비밀번호 저장 | bcrypt 단방향 해시 | `bcrypt.hashpw()` |
| JWT 토큰 | HS256 알고리즘 | `python-jose` 라이브러리 |
| 토큰 저장 | sessionStorage | Zustand persist 미들웨어 |
| HTTPS | 모든 통신 HTTPS | Nginx SSL 인증서 |
| CORS | 허용된 도메인만 접근 | FastAPI CORS 미들웨어 |
| SQL Injection | ORM 사용 | SQLAlchemy Parameterized Query |
| XSS | 입력 값 이스케이프 | React 기본 보호 |
| 파일 업로드 | MIME 타입 검증, 크기 제한 | 백엔드 검증 |
| 이미지 삭제 | 24시간 후 자동 삭제 | 로컬 uploads/ 폴더 스케줄러 |

---

### 6.4 가용성

| 항목 | 목표 | 구현 방법 |
|------|------|----------|
| Redis 장애 | 서비스 중단 없음 | Graceful Degradation (DB 직접 조회) |
| OCR 실패 | 3회 재시도 후 수동 입력 유도 | httpx retry 로직 |
| LLM 실패 | 에러 메시지 반환 | guide_results.status = "failed" |
| 에러 핸들링 | 모든 에러에 명확한 메시지 | 에러 코드 + 한글 메시지 |
| Mock 모드 | 외부 API 없이 전체 기능 테스트 | USE_MOCK_OCR / USE_MOCK_ANALYSIS / USE_MOCK_CHAT |

---

## 7. 테스트 시나리오

### 7.1 회원가입 테스트

#### 시나리오 1: 정상 회원가입 (이메일)

**Given:** 사용자가 회원가입 페이지에 접속
**When:** 이름·이메일·비밀번호·비밀번호 확인 입력 후 "무료로 시작하기" 클릭
**Then:**
- [ ] 회원가입 성공 (201 Created)
- [ ] JWT 토큰 발급 → sessionStorage 저장
- [ ] 건강 프로필 설정 온보딩(1단계)으로 이동

**테스트 데이터:**
```json
{
  "name": "홍길동",
  "email": "test@example.com",
  "password": "Password123!"
}
```

---

#### 시나리오 2: 중복 이메일

**Given:** 이미 가입된 이메일 (`test@example.com`)
**When:** 동일한 이메일로 회원가입 시도
**Then:**
- [ ] 회원가입 실패 (409 Conflict)
- [ ] 에러 메시지: "이미 가입된 이메일입니다"
- [ ] 이메일 입력 필드에 빨간색 테두리

---

#### 시나리오 3: 비밀번호 불일치

**Given:** 사용자가 회원가입 페이지에 접속
**When:** 비밀번호와 비밀번호 확인이 다름
**Then:**
- [ ] 에러 메시지: "비밀번호가 일치하지 않습니다"
- [ ] 무료로 시작하기 버튼 비활성화

---

#### 시나리오 4: 비밀번호 강도 부족

**Given:** 사용자가 회원가입 페이지에 접속
**When:** 비밀번호 "1234" 입력 (8자 미만, 영문 없음)
**Then:**
- [ ] 에러 메시지: "비밀번호는 8자 이상이어야 합니다"
- [ ] 에러 메시지: "영문을 포함해야 합니다"
- [ ] 무료로 시작하기 버튼 비활성화

---

### 7.2 로그인 테스트

#### 시나리오 1: 정상 로그인

**Given:** 가입된 사용자 (`test@example.com` / `Password123!`)
**When:** 올바른 이메일·비밀번호 입력 후 "이메일로 로그인" 클릭
**Then:**
- [ ] 로그인 성공 (200 OK)
- [ ] JWT 토큰 → sessionStorage 저장 (Zustand persist)
- [ ] 대시보드로 이동

---

#### 시나리오 2: 잘못된 비밀번호

**Given:** 가입된 사용자
**When:** 잘못된 비밀번호 입력
**Then:**
- [ ] 로그인 실패 (401 Unauthorized)
- [ ] 에러 메시지: "이메일 또는 비밀번호가 잘못되었습니다"

---

#### 시나리오 3: 로그아웃

**Given:** 로그인한 사용자
**When:** 마이페이지 → 로그아웃 버튼 클릭
**Then:**
- [ ] sessionStorage에서 토큰 삭제
- [ ] Zustand store 초기화
- [ ] 로그인 페이지로 이동

---

### 7.3 온보딩 테스트

#### 시나리오 1: 4단계 전체 완료

**Given:** 신규 가입 사용자
**When:** 기본정보 → 기저질환 → 복용약 → 알레르기 순서로 입력 후 완료
**Then:**
- [ ] health_profiles 테이블 저장 (키·몸무게·혈액형·흡연·음주·운동)
- [ ] chronic_conditions 테이블 저장
- [ ] medications 테이블 저장 (standardized_name 자동 생성)
- [ ] allergies 테이블 저장
- [ ] 대시보드로 이동

---

#### 시나리오 2: 기저질환 직접 입력

**Given:** 온보딩 2단계
**When:** 목록에 없는 질환명 직접 입력 후 추가 버튼 클릭
**Then:**
- [ ] 입력한 질환이 선택 태그로 추가됨
- [ ] chronic_conditions 테이블에 저장

---

#### 시나리오 3: 복용약 OCR 자동 추출

**Given:** 온보딩 3단계
**When:** 처방전 사진 업로드
**Then:**
- [ ] OCR 처리 완료 (Naver Clova)
- [ ] 약 이름 자동 인식 후 입력 필드에 채워짐
- [ ] 사용자가 확인 후 + 약 추가 가능

---

### 7.4 처방전 분석 테스트

#### 시나리오 1: 정상 분석 플로우

**Given:** 로그인한 사용자, 처방전 이미지 준비
**When:**
1. 처방전 분석 페이지 접속
2. 부위·상황 선택
3. 처방전 이미지 업로드
4. AI 분석 시작 클릭
**Then:**
- [ ] 파일 uploads/ 폴더 저장
- [ ] OCR 처리 → ocr_results 저장
- [ ] BackgroundTasks로 비동기 분석 시작 (202 반환)
- [ ] 폴링 시작 (3초 간격)
- [ ] 분석 완료 → 대시보드 분석 이력에 결과 표시

---

#### 시나리오 2: 지원 파일 형식 테스트

**Given:** 다양한 파일 형식 준비
**When:** 각 파일 업로드 시도
**Then:**

| 파일 형식 | 결과 |
|---------|------|
| JPG | ✅ 업로드 성공 |
| PNG | ✅ 업로드 성공 |
| WEBP | ✅ 업로드 성공 |
| PDF | ✅ 업로드 성공 |
| GIF | ❌ 에러: "JPG, PNG, WEBP, PDF 파일만 가능합니다" |
| 11MB JPG | ❌ 에러: "파일 크기는 10MB 이하여야 합니다" |

---

#### 시나리오 3: 분석 타임아웃

**Given:** BackgroundTasks가 응답하지 않는 상황
**When:** 분석 시작 후 폴링 진행
**Then:**
- [ ] 10회(30초) 시도 후 "분석이 지연되고 있습니다" 메시지 표시
- [ ] 20회(60초) 시도 후 타임아웃 에러 표시
- [ ] 타임아웃 후 폴링 중단 (무한 루프 방지)
- [ ] "다시 시도" 버튼 표시

---

### 7.5 재활 운동 테스트

#### 시나리오 1: 고혈압 + 골다공증 환자 손목 분석

**Given:**
- 기저질환: 고혈압, 골다공증
- 부위: 손목/손
- 상황: 골절/뼈 부상

**When:** AI 분석 완료
**Then:**
- [ ] rehab_plans 테이블 저장 (target_area: "손목")
- [ ] rehab_exercises 테이블 저장 (exercise_library 매핑)
- [ ] 낙상 위험 운동 제외 (골다공증 고려)
- [ ] 주의사항 배너 표시 ("부목 착용 중이며...")
- [ ] 달력 뷰에 주차별 날짜 표시

---

#### 시나리오 2: 운동 완료 기록

**Given:** 재활 운동 페이지, 운동 카드 표시 중
**When:** "✓ 완료" 버튼 클릭
**Then:**
- [ ] exercise_completions 테이블 저장 (completed_date 포함)
- [ ] 오늘 진행률 업데이트
- [ ] 완료 버튼 스타일 변경 (초록색 활성)
- [ ] 달력 해당 날짜 진행률 업데이트

---

### 7.6 챗봇 테스트

#### 시나리오 1: 컨텍스트 인식 질문

**Given:** 손목 골절 분석 결과가 있는 사용자
**When:** "운동할 때 주의사항이 있나요?" 질문
**Then:**
- [ ] SSE 스트리밍으로 실시간 답변 표시
- [ ] 현재 재활 플랜 컨텍스트 반영
- [ ] seed_knowledge.json 내용 참고
- [ ] 마크다운 렌더링 (**굵게** 등)
- [ ] 면책 문구 없음 (실제 화면 기준)

---

#### 시나리오 2: 새 대화 시작

**Given:** 기존 세션이 있는 사용자
**When:** "+ 새 대화 시작" 버튼 클릭
**Then:**
- [ ] 새 chat_sessions 생성
- [ ] 대화 목록에 새 세션 추가
- [ ] 채팅 영역 초기화

---

#### 시나리오 3: SSE 스트리밍 동작

**Given:** 챗봇 질문 전송
**When:** POST /api/v1/chat/stream 호출
**Then:**
- [ ] 청크 단위로 텍스트 실시간 렌더링
- [ ] 타이핑 애니메이션 표시
- [ ] 스트리밍 완료 후 전체 메시지 표시
- [ ] chat_messages 테이블 저장

---

### 7.7 마이페이지 테스트

#### 시나리오 1: 이름 수정

**Given:** 로그인한 사용자
**When:** 마이페이지 → 이름 수정 → 저장
**Then:**
- [ ] PATCH /api/v1/auth/me 호출
- [ ] 사이드바 이름 즉시 업데이트
- [ ] 헤더 이름 즉시 업데이트

---

#### 시나리오 2: 비밀번호 변경

**Given:** 로그인한 사용자
**When:** 현재 비밀번호·새 비밀번호·확인 입력 후 변경
**Then:**
- [ ] PATCH /api/v1/auth/me/password 호출
- [ ] 성공 시 "비밀번호가 변경되었습니다" 메시지
- [ ] 현재 비밀번호 틀릴 경우 에러 메시지

---

#### 시나리오 3: 회원탈퇴

**Given:** 로그인한 사용자
**When:** 회원탈퇴 버튼 클릭 → 확인 다이얼로그 → 확인
**Then:**
- [ ] DELETE /api/v1/auth/me 호출
- [ ] sessionStorage 토큰 삭제
- [ ] 랜딩 페이지로 이동
- [ ] 재로그인 시도 시 "이메일 또는 비밀번호가 잘못되었습니다"

---

### 7.8 건강 프로필 테스트

#### 시나리오 1: 기저질환 수정

**Given:** 건강 프로필 페이지
**When:** 기저질환 섹션 "수정" 버튼 클릭 → 질환 추가/삭제 → 저장
**Then:**
- [ ] chronic_conditions 테이블 업데이트
- [ ] 건강 프로필 페이지 즉시 반영

---

#### 시나리오 2: 복용약 수정

**Given:** 건강 프로필 페이지
**When:** 복용약 섹션 "수정" 버튼 클릭 → 약 추가 → 저장
**Then:**
- [ ] medications 테이블 저장
- [ ] standardized_name drug_normalizer.py 자동 생성
- [ ] 건강 프로필 페이지 즉시 반영

---

### 7.9 Mock 모드 테스트

#### 시나리오 1: 전체 Mock 모드

**Given:** 환경변수 설정
```
USE_MOCK_OCR=true
USE_MOCK_ANALYSIS=true
USE_MOCK_CHAT=true
```

**When:** 처방전 업로드 → 분석 → 챗봇 질문
**Then:**
- [ ] Naver Clova OCR API 호출 없이 고정 결과 반환
- [ ] OpenAI GPT API 호출 없이 고정 분석 결과 반환
- [ ] OpenAI GPT API 호출 없이 고정 챗봇 응답 반환
- [ ] 전체 플로우 정상 동작 확인

---

#### 시나리오 2: 프로덕션 모드 확인

**Given:** 배포 환경
**When:** 환경변수 확인
**Then:**
- [ ] USE_MOCK_OCR=false
- [ ] USE_MOCK_ANALYSIS=false
- [ ] USE_MOCK_CHAT=false

---

## 8. 에러 코드 정의

### 8.1 인증 에러 (AUTH_XXX)

| 코드 | HTTP Status | 메시지 | 원인 |
|------|-------------|--------|------|
| AUTH_001 | 400 | "이메일 형식이 올바르지 않습니다" | 이메일 정규식 불일치 |
| AUTH_002 | 400 | "비밀번호는 8자 이상이어야 합니다" | 비밀번호 길이 부족 |
| AUTH_003 | 409 | "이미 가입된 이메일입니다" | 중복 이메일 |
| AUTH_004 | 401 | "이메일 또는 비밀번호가 잘못되었습니다" | 로그인 실패 |
| AUTH_005 | 401 | "로그인이 필요합니다" | JWT 토큰 없음 |
| AUTH_006 | 401 | "토큰이 만료되었습니다" | JWT 토큰 만료 |
| AUTH_007 | 401 | "유효하지 않은 토큰입니다" | JWT 검증 실패 |
| AUTH_008 | 400 | "비밀번호에 영문을 포함해야 합니다" | 영문 미포함 |
| AUTH_009 | 400 | "비밀번호에 숫자를 포함해야 합니다" | 숫자 미포함 |
| AUTH_010 | 400 | "현재 비밀번호가 일치하지 않습니다" | 비밀번호 변경 실패 |

---

### 8.2 프로필 에러 (PROFILE_XXX)

| 코드 | HTTP Status | 메시지 | 원인 |
|------|-------------|--------|------|
| PROFILE_001 | 400 | "최소 1개 이상의 질환을 선택해주세요" | 기저질환 미선택 |
| PROFILE_002 | 400 | "올바른 용량 형식이 아닙니다 (예: 500mg, 1정)" | 용량 형식 오류 |
| PROFILE_003 | 400 | "복용 횟수는 1~4회만 가능합니다" | 복용 횟수 범위 초과 |
| PROFILE_004 | 404 | "프로필을 찾을 수 없습니다" | 프로필 미존재 |
| PROFILE_005 | 400 | "올바른 키 범위가 아닙니다 (50~250cm)" | 키 범위 초과 |
| PROFILE_006 | 400 | "올바른 몸무게 범위가 아닙니다 (10~300kg)" | 몸무게 범위 초과 |

---

### 8.3 OCR 에러 (OCR_XXX)

| 코드 | HTTP Status | 메시지 | 원인 |
|------|-------------|--------|------|
| OCR_001 | 400 | "이미지 용량은 10MB 이하여야 합니다" | 파일 크기 초과 |
| OCR_002 | 400 | "JPG, PNG, WEBP, PDF 파일만 가능합니다" | 지원하지 않는 형식 |
| OCR_003 | 500 | "인식 실패. 직접 입력해주세요" | OCR API 3회 재시도 실패 |
| OCR_004 | 200 | "인식 정확도가 낮습니다. 확인해주세요" | 신뢰도 < 0.7 (경고) |
| OCR_005 | 404 | "OCR 결과를 찾을 수 없습니다" | OCR 결과 미존재 |
| OCR_006 | 403 | "OCR 결과에 접근할 권한이 없습니다" | 소유권 검증 실패 |

---

### 8.4 분석 에러 (ANALYSIS_XXX)

| 코드 | HTTP Status | 메시지 | 원인 |
|------|-------------|--------|------|
| ANALYSIS_001 | 400 | "문서 ID가 필요합니다" | document_id 미제공 |
| ANALYSIS_002 | 400 | "올바른 수술 부위가 아닙니다" | target_area 값 오류 |
| ANALYSIS_003 | 404 | "분석 결과를 찾을 수 없습니다" | guide_result_id 미존재 |
| ANALYSIS_004 | 403 | "분석 결과에 접근할 권한이 없습니다" | 소유권 검증 실패 |
| ANALYSIS_005 | 500 | "분석 중 오류가 발생했습니다" | 서버 내부 오류 |

---

### 8.5 LLM 에러 (LLM_XXX)

| 코드 | HTTP Status | 메시지 | 원인 |
|------|-------------|--------|------|
| LLM_001 | 500 | "분석 중 오류 발생. 다시 시도해주세요" | OpenAI API 호출 실패 |
| LLM_002 | 500 | "분석 결과 처리 중 오류 발생" | JSON 파싱 실패 |
| LLM_003 | 504 | "분석 시간 초과. 다시 시도해주세요" | 30초 타임아웃 |
| LLM_004 | 429 | "요청이 너무 많습니다. 잠시 후 다시 시도해주세요" | Rate Limit 초과 |
| LLM_005 | 500 | "AI 서비스가 일시적으로 사용 불가합니다" | OpenAI API 장애 |

---

### 8.6 챗봇 에러 (CHAT_XXX)

| 코드 | HTTP Status | 메시지 | 원인 |
|------|-------------|--------|------|
| CHAT_001 | 400 | "메시지를 입력해주세요" | 빈 메시지 전송 |
| CHAT_002 | 400 | "메시지는 1000자 이하여야 합니다" | 메시지 길이 초과 |
| CHAT_003 | 404 | "채팅 세션을 찾을 수 없습니다" | session_id 미존재 |
| CHAT_004 | 500 | "챗봇 응답 생성 실패" | LLM API 오류 |
| CHAT_005 | 403 | "채팅 세션에 접근할 권한이 없습니다" | 소유권 검증 실패 |

---

### 8.7 파일 에러 (FILE_XXX)

| 코드 | HTTP Status | 메시지 | 원인 |
|------|-------------|--------|------|
| FILE_001 | 400 | "파일이 제공되지 않았습니다" | 파일 미첨부 |
| FILE_002 | 400 | "파일 이름이 너무 깁니다" | 파일명 길이 초과 |
| FILE_003 | 500 | "로컬 파일 저장 실패" | uploads/ 폴더 저장 오류 |
| FILE_004 | 500 | "로컬 파일 삭제 실패" | uploads/ 폴더 삭제 오류 |

---

### 8.8 데이터베이스 에러 (DB_XXX)

| 코드 | HTTP Status | 메시지 | 원인 |
|------|-------------|--------|------|
| DB_001 | 500 | "데이터베이스 연결 실패" | DB 연결 오류 |
| DB_002 | 500 | "데이터 저장 실패" | DB INSERT 오류 |
| DB_003 | 500 | "데이터 조회 실패" | DB SELECT 오류 |
| DB_004 | 409 | "데이터 충돌" | Unique 제약 위반 |

---

### 8.9 일반 에러 (GENERAL_XXX)

| 코드 | HTTP Status | 메시지 | 원인 |
|------|-------------|--------|------|
| GENERAL_001 | 400 | "잘못된 요청입니다" | 요청 형식 오류 |
| GENERAL_002 | 404 | "요청한 리소스를 찾을 수 없습니다" | 리소스 미존재 |
| GENERAL_003 | 405 | "허용되지 않은 메서드입니다" | HTTP 메서드 오류 |
| GENERAL_004 | 500 | "서버 내부 오류" | 예상치 못한 오류 |
| GENERAL_005 | 503 | "서비스를 일시적으로 사용할 수 없습니다" | 서버 점검 중 |

---

## 9. 에러 응답 형식

### 9.1 표준 에러 응답

```json
{
  "error_code": "AUTH_001",
  "message": "이메일 형식이 올바르지 않습니다",
  "details": {
    "field": "email",
    "value": "invalid-email"
  },
  "timestamp": "2026-03-20T15:30:00Z"
}
```

---

### 9.2 유효성 검증 에러 (422)

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "입력 값이 올바르지 않습니다",
  "errors": [
    {
      "field": "email",
      "message": "이메일 형식이 올바르지 않습니다"
    },
    {
      "field": "password",
      "message": "비밀번호는 8자 이상이어야 합니다"
    }
  ],
  "timestamp": "2026-03-20T15:30:00Z"
}
```

---

### 9.3 프론트엔드 에러 처리

```typescript
// axios 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout(); // sessionStorage 토큰 삭제
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 10. 개발 가이드라인

### 10.1 코드 스타일

#### Python (Backend)

```python
# ✅ 좋은 예
async def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> UserProfile:
    """사용자 프로필 조회"""
    result = await db.execute(
        select(HealthProfile).where(
            HealthProfile.user_id == user_id,
            HealthProfile.user_id == current_user.id  # 소유권 검증
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="프로필을 찾을 수 없습니다")
    return profile
```

**도구:**
- Formatter: `black`
- Linter: `flake8`
- Type Checker: `mypy`

---

#### TypeScript/React (Frontend)

```typescript
// ✅ 좋은 예
const ChatPage: React.FC = () => {
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);

  const handleStream = async (message: string) => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/chat/stream`
    );
    eventSource.onmessage = (e) => {
      const { chunk } = JSON.parse(e.data);
      setMessages((prev) => [...prev, { role: 'assistant', content: chunk }]);
    };
  };

  return <div>...</div>;
};
```

**도구:**
- Formatter: `prettier`
- Linter: `eslint`
- 번들러: `Vite 7`

---

### 10.2 환경 변수

**Backend (.env):**
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/chroniccare

# JWT
SECRET_KEY=your-secret-key-here

# OpenAI
OPENAI_API_KEY=sk-...

# Naver Clova OCR
CLOVA_OCR_SECRET=...
CLOVA_OCR_APIGW_URL=https://...

# Mock 모드 (개발용)
USE_MOCK_OCR=false
USE_MOCK_ANALYSIS=false
USE_MOCK_CHAT=false
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:8000/api/v1
```

---

### 10.3 Git 커밋 메시지

```
feat(auth): 카카오 OAuth 로그인 구현
fix(ocr): WEBP 파일 업로드 오류 수정
docs(requirements): 온보딩 4단계 UI 요구사항 추가
refactor(chat): SSE 스트리밍 엔드포인트 분리
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가
- `chore`: 빌드/설정 변경

---

## 11. 배포 체크리스트

### 11.1 배포 전 확인 사항

**코드:**
- [ ] 모든 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 불필요한 console.log 제거
- [ ] Mock 모드 3개 모두 false 확인

**환경 변수:**
- [ ] OPENAI_API_KEY 유효성 확인
- [ ] CLOVA_OCR_SECRET 유효성 확인
- [ ] SECRET_KEY 충분한 길이 확인
- [ ] VITE_API_URL 프로덕션 URL로 변경
- [ ] USE_MOCK_OCR=false
- [ ] USE_MOCK_ANALYSIS=false
- [ ] USE_MOCK_CHAT=false

**Docker:**
- [ ] docker-compose up -d → 4개 서비스 모두 healthy
- [ ] postgres: pgvector/pgvector:pg15 이미지 정상 기동
- [ ] init.sql → 17개 테이블 생성 확인
- [ ] seed_exercises.sql → exercise_library 데이터 로딩 확인
- [ ] uploads/ 볼륨 마운트 확인
- [ ] redis_data 볼륨 마운트 확인

**보안:**
- [ ] HTTPS 설정
- [ ] CORS 허용 도메인 제한
- [ ] .env 파일 .gitignore 처리 확인

---

### 11.2 배포 후 확인 사항

**기능 테스트:**
- [ ] 회원가입 (이메일)
- [ ] 로그인 → sessionStorage 토큰 저장 확인
- [ ] 온보딩 4단계 전체 완료
- [ ] 처방전 업로드 (JPG/PNG/WEBP/PDF)
- [ ] OCR 처리 → 분석 시작 → 폴링 → 완료
- [ ] 재활 운동 달력 뷰 + 완료 기록
- [ ] 챗봇 SSE 스트리밍 동작
- [ ] 마이페이지 이름 수정·비밀번호 변경
- [ ] 건강 프로필 수정
- [ ] 로그아웃 → sessionStorage 초기화 확인

**성능 테스트:**
- [ ] OCR 처리 시간 < 5초
- [ ] AI 분석 완료 시간 < 30초
- [ ] 챗봇 첫 청크 < 2초
- [ ] 일반 API 응답 < 200ms

**Redis 테스트:**
- [ ] 재활 플랜 조회 캐싱 동작 확인
- [ ] Redis 연결 중단 시 Graceful Degradation 확인

---

## 12. 문서 종료

### 12.1 문서 요약

**이 문서는 다음을 정의합니다:**

1. **사용자 스토리 (18개)** — 인증·프로필·OCR·분석·재활·챗봇·대시보드
2. **API 엔드포인트 (25개)** — /api/v1 접두사, Request/Response 예시
3. **화면별 UI 요구사항 (10개 화면)** — 실제 스크린샷 기준
   - 랜딩·회원가입·로그인·온보딩 4단계·대시보드
   - 처방전분석·재활운동·챗봇·마이페이지·건강프로필
4. **데이터 검증 규칙** — 회원가입·파일업로드·약물·기본건강정보
5. **권한 및 접근 제어** — JWT·sessionStorage·소유권 검증
6. **비기능적 요구사항** — 성능·접근성·보안·가용성
7. **테스트 시나리오 (30개 이상)** — Mock 모드 포함
8. **에러 코드 정의 (50개 이상)** — AUTH·PROFILE·OCR·ANALYSIS·LLM·CHAT
9. **개발 가이드라인** — 코드 스타일·환경변수·Git 커밋
10. **배포 체크리스트** — 배포 전/후 확인 사항

---

### 12.2 관련 문서

- `00_unified_RDD.md`: 프로젝트 전체 개요, 시스템 아키텍처
- `docker-compose.yml`: 4개 서비스 구성
- `data/init.sql`: 17개 테이블 스키마
- `data/seed_exercises.sql`: 운동 라이브러리 Seed Data
- `chroniccare-backend/seeds/seed_knowledge.json`: 챗봇 컨텍스트 지식베이스
```