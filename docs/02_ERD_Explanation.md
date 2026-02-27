### 2. ERD 설명서

```markdown
# ChronicCare Ortho ERD 설명서

**작성일:** 2026-02-25
**총 테이블 수:** 18개 (필수:17개 + 선택:1개)
**데이터베이스:** PostgreSQL 14+

```

## 1. 테이블 구조 개요

### Tier 1: 사용자 및 프로필 (5개) - 필수
```
users                    ← 사용자 기본 정보
health_profiles          ← 건강 프로필 (키, 몸무게, 생활습관)
chronic_conditions       ← 만성질환 (당뇨, 고혈압, 골다공증)
medications              ← 복용 약물 (기존약 + 신규약)
allergies                ← 알러지 정보
```

### Tier 2: OCR 및 문서 처리 (2개) - 필수
```
documents                ← 업로드 문서 메타데이터
ocr_results              ← OCR 처리 결과
```

### Tier 3: AI 분석 결과 (4개) - 필수
```
guide_results            ← AI 생성 종합 가이드
drug_interactions        ← 약물 상호작용 분석
medication_schedules     ← 복약 시간표
rehab_plans              ← 재활 계획 헤더
```

### Tier 4: 재활 운동 (3개) - 필수
```
exercise_library         ← 운동 라이브러리 (Seed Data)
rehab_exercises          ← 재활 운동 처방
exercise_completions     ← 운동 완료 기록
```

### Tier 5: 챗봇 (3개) - 필수
```
chat_sessions            ← 챗봇 세션
chat_messages            ← 챗봇 메시지 이력
feedbacks                ← 사용자 피드백 및 로그
```

### Tier 6: 알림 (1개) - 선택
```
notifications            ← 알림 (가이드 완료, 복약 리마인더)
```

---

## 2. 주요 관계 (Relationships)

### 2.1 사용자 중심 관계
```

users (1) ─────┬──── (N) health_profiles
├──── (N) chronic_conditions
├──── (N) medications
├──── (N) allergies
├──── (N) documents
├──── (N) guide_results
├──── (N) chat_sessions
└──── (N) notifications

```

### 2.2 OCR 처리 흐름
```

documents (1) ──── (1) ocr_results

```
- **1:1 관계**: 하나의 문서는 하나의 OCR 결과를 가짐

### 2.3 AI 분석 결과 구조
```

guide_results (1) ─┬─ (N) drug_interactions
├─ (N) medication_schedules
└─ (1) rehab_plans

```
- **1:N 관계**: 하나의 가이드는 여러 상호작용/시간표를 가짐
- **1:1 관계**: 하나의 가이드는 하나의 재활 계획을 가짐

### 2.4 재활 운동 구조
```

rehab_plans (1) ──── (N) rehab_exercises
rehab_exercises (N) ──── (1) exercise_library

```
- **1:N 관계**: 하나의 재활 계획은 여러 운동을 포함
- **N:1 관계**: 여러 처방이 하나의 운동 템플릿을 참조

### 2.5 챗봇 구조
```
chat_sessions (1) ──── (N) chat_messages

```
- **1:N 관계**: 하나의 세션은 여러 메시지를 포함

---

## 3. 핵심 테이블 상세 설명

### 3.1 users (사용자)
**목적:** 회원가입 및 인증 정보 저장

**주요 컬럼:**
- `email`: 로그인 ID (unique)
- `password_hash`: bcrypt 해싱된 비밀번호
- `birth_date`: 나이 계산용 (약물 용량 조절 시 필요)
- `gender`: 성별 (M/F)

**인덱스:**
- `email` (로그인 성능 향상)

---

### 3.2 health_profiles (건강 프로필)

**목적:** 사용자의 기본 건강 정보 저장

**설명:** 키, 몸무게, 생활습관 등 건강 프로필을 저장합니다. 1:1 관계로 한 사용자당 하나의 프로필만 가집니다.

**주요 컬럼:**
- `user_id`: 사용자 참조 (FK, unique)
- `height`: 키 (cm, decimal)
- `weight`: 몸무게 (kg, decimal)
- `blood_type`: 혈액형 (A/B/O/AB)
- `smoking_status`: 흡연 여부 (비흡연/과거흡연/현재흡연)
- `alcohol_frequency`: 음주 빈도 (안함/가끔/자주)
- `exercise_frequency`: 운동 빈도 (안함/주1-2회/주3-4회/매일)

**비즈니스 로직:**
- 회원가입 후 프로필 작성 단계에서 입력
- BMI 계산: `weight / (height/100)^2`
- 비만도에 따라 운동 강도 조절 (LLM 프롬프트에 전달)
- 흡연/음주 정보는 약물 상호작용 분석 시 참고

---

### 3.3 chronic_conditions (만성질환)
**목적:** 사용자의 기저질환 관리

**주요 컬럼:**
- `condition_type`: 당뇨/고혈압/골다공증
- `diagnosed_date`: 진단일 (질환 기간 계산)
- `severity`: 경증/중등도/중증

**비즈니스 로직:**
- 한 사용자가 여러 질환 가질 수 있음 (복수 선택)
- LLM 프롬프트에 질환 정보 전달

---

### 3.4 medications (복용 약물)

**목적:** 기존 복용약 + 신규 처방약 통합 관리

**주요 컬럼:**
- `id`: 기본키 (SERIAL)
- `user_id`: 사용자 참조 (FK, NOT NULL)
- `medication_name`: 사용자 입력 또는 OCR 원본 (예: "타이레놀정500mg") **(NOT NULL)**
- `standardized_name`: 표준 약물명 (예: "타이레놀") **(자동완성 DB 매칭)**
- `ingredient`: 성분명 (예: "Acetaminophen") **(추가됨, 약물 상호작용 분석용)**
- `dosage`: 용량 (예: "500mg") **(필수 추가, NOT NULL)**
- `frequency`: 일일 복용 횟수 (예: 3) **(필수 추가, NOT NULL, CHECK: 1~4)**
- `timing`: 복용 시간대 배열 (JSONB, 예: `["morning", "evening"]`) **(필수 추가)**
- `medication_type`: 'CHRONIC'(기존약) 또는 'NEW'(신규약) **(NOT NULL)**
- `is_active`: 현재 복용 중 여부 (BOOLEAN, 기본값: true)
- `created_at`: 생성 일시 (TIMESTAMP, 기본값: now())

**비즈니스 로직:**
- 기존약: 사용자가 온보딩 단계에서 직접 입력
  - 프론트엔드에서 자동완성으로 `medication_name` 선택
  - 백엔드에서 `standardized_name`, `ingredient` 자동 매핑
- 신규약: OCR 결과에서 자동 생성
  - `ocr_results.structured_data`에서 약물 정보 추출
  - LLM으로 `standardized_name`, `ingredient` 추출
- **약물 상호작용 분석은 `ingredient` 컬럼으로 수행** (정확도 향상)
  - 예: "타이레놀" + "아세트아미노펜" → 둘 다 `ingredient='Acetaminophen'`으로 매칭
- `is_active=true`인 약물만 분석에 사용
- `timing`은 JSONB 배열로 저장하여 유연하게 대응
  - 예: `["morning", "evening"]` → 아침, 저녁 복용

**제약 조건:**
```sql
ALTER TABLE medications 
  ADD CONSTRAINT chk_frequency CHECK (frequency BETWEEN 1 AND 4);

ALTER TABLE medications 
  ADD CONSTRAINT chk_medication_type CHECK (medication_type IN ('CHRONIC', 'NEW'));
```

**인덱스:**
- (user_id, is_active): 사용자별 활성 약물 조회
- (ingredient): 약물 상호작용 분석 시 빠른 매칭
- (standardized_name): 자동완성 검색

---

### 3.5 allergies (알러지 정보)

**목적:** 사용자의 알러지 정보 관리

**설명:** 약물, 음식, 환경 알러지 정보를 저장합니다. 약물 상호작용 분석 시 필수 데이터입니다.

**주요 컬럼:**
- `user_id`: 사용자 참조 (FK)
- `allergen_name`: 알러지 유발 물질 (예: 페니실린, 땅콩, 꽃가루)
- `allergen_type`: 알러지 유형 (약물/음식/환경)
- `severity`: 심각도 (경증/중등도/중증)
- `reaction_description`: 반응 증상 (예: 두드러기, 호흡곤란)

**비즈니스 로직:**
- 한 사용자가 여러 알러지를 가질 수 있음 (1:N)
- LLM 프롬프트에 알러지 정보 전달
- 신규 처방약이 알러지 물질을 포함하면 경고 표시
- `severity='중증'`인 경우 빨간색 경고 표시
- 예: 사용자가 "페니실린 알러지"가 있는데 처방전에 "아모시실린"이 있으면 경고

---

### 3.6 documents (업로드 문서)

**목적:** 업로드된 문서 메타데이터 저장

**설명:** 사용자가 업로드한 처방전/약봉투/검사결과 이미지의 메타데이터를 저장합니다.

**주요 컬럼:**
- `user_id`: 사용자 참조 (FK)
- `document_type`: 문서 유형 (처방전/약봉투/검사결과)
- `file_path`: S3 저장 경로
- `file_size`: 파일 크기 (bytes)
- `mime_type`: MIME 타입 (image/jpeg, image/png)
- `uploaded_at`: 업로드 시각

**비즈니스 로직:**
- 파일 업로드 시 S3에 저장 후 경로를 DB에 저장
- S3 Lifecycle 정책으로 24시간 후 자동 삭제 (보안)
- OCR 처리는 `file_path`를 참조하여 수행
- 1:1 관계: 하나의 문서는 하나의 OCR 결과를 가짐

**보안:**
- 원본 이미지는 24시간 후 자동 삭제
- OCR 결과(`ocr_results` 테이블)만 영구 보관
- 개인정보 보호를 위해 이미지 원본은 최소 보관

---

### 3.7 ocr_results (OCR 결과)

**목적:** OCR 처리 결과 저장

**설명:** 업로드된 문서의 OCR 처리 결과를 저장합니다. 1:1 관계로 하나의 문서는 하나의 OCR 결과를 가집니다.

**주요 컬럼:**
- `document_id`: 문서 참조 (FK, unique)
- `raw_text`: OCR 원본 텍스트
- `structured_data`: **JSONB 형태의 파싱된 약물 데이터**
- `confidence_score`: OCR 신뢰도 (0~100)
- `is_confirmed`: 사용자 확인 완료 여부

**JSONB 구조 예시:**
```json
{
  "medications": [
    {
      "name": "타이레놀정 500mg",
      "dosage": "1정",
      "frequency": "1일 3회",
      "duration": "7일분"
    }
  ],
  "hospital": "서울대학교병원",
  "doctor": "홍길동",
  "prescription_date": "2024-03-15"
}
```

**비즈니스 로직:**

- OCR 처리 후 structured_data에 JSONB로 저장
- JSONB 사용 이유: 인덱싱 가능, 빠른 조회, JSON 연산자 사용 가능
- 사용자가 확인하면 is_confirmed=true로 변경
- 확인 후 medications 테이블에 데이터 생성


---

### 3.8 guide_results (AI 생성 가이드)

**목적:** LLM이 생성한 종합 가이드 저장

**주요 컬럼:**

- `overall_safety_score`: 0~100 점수 (안전도)
- `medication_guide`: 복약 안내 텍스트
- `lifestyle_guide`: 생활습관 가이드 텍스트
- `warning_signs`: 위험 징후 텍스트

**비즈니스 로직:**

- 하나의 OCR 결과당 하나의 가이드 생성
- 사용자는 여러 가이드를 가질 수 있음 (이력 관리)

---

### 3.9 drug_interactions (약물 상호작용)

**목적:** 약물 간 상호작용 위험 저장

**주요 컬럼:**

- `medication_a`, `medication_b`: 상호작용 약물 쌍
- `severity`: high/medium/low
- `mechanism`: 상호작용 원리 (예: "신장 기능 저하")
- `recommendation`: 권장 조치

**비즈니스 로직:**

- `severity=high`인 경우 빨간색 경고 표시
- 프론트엔드에서 severity별 필터링 가능

---

### 3.10 medication_schedules (복약 시간표)

**목적:** AI가 생성한 복약 시간표

**설명:** 약물별 복약 시간을 JSONB 형태로 저장합니다.

**주요 컬럼:**
- `user_id`: 사용자 참조 (FK)
- `guide_result_id`: 분석 결과 참조 (FK)
- `medications`: **JSONB 형태의 약물별 복약 시간표**

**JSONB 구조 예시:**
```json
{
  "schedule": [
    {
      "medication_id": 123,
      "medication_name": "타이레놀정 500mg",
      "times": ["08:00", "13:00", "19:00"],
      "timing": "식후 30분"
    },
    {
      "medication_id": 124,
      "medication_name": "오메가3",
      "times": ["08:00"],
      "timing": "식후"
    }
  ]
}
```

**비즈니스 로직:**

- LLM이 약물 상호작용을 고려하여 최적의 복약 시간 생성
- JSONB 사용 이유: 복잡한 스케줄 구조를 유연하게 저장, 빠른 조회
- 프론트엔드는 이 데이터를 파싱하여 타임라인 UI 표시

---

### 3.11 rehab_plans (재활 계획)

**목적:** 재활 계획 헤더 (주차별 운동 묶음)

**설명:** AI가 생성한 재활 계획의 헤더 정보를 저장합니다. 하나의 가이드는 하나의 재활 계획을 가집니다.

**주요 컬럼:**
- `user_id`: 사용자 참조 (FK)
- `guide_result_id`: 분석 결과 참조 (FK)
- `target_area`: 목표 부위 (무릎/어깨/허리 등)
- `duration_weeks`: 계획 기간 (4주/8주 등)
- `precautions`: 주의사항
- `is_active`: 현재 활성 플랜 여부 (기본값: true)

**비즈니스 로직:**
- 하나의 가이드는 하나의 재활 계획을 가짐 (1:1)
- 새로운 가이드 생성 시 기존 플랜의 `is_active`를 `false`로 변경
- 프론트엔드는 `is_active = true`인 플랜만 "현재 플랜"으로 표시
- 사용자는 과거 플랜도 조회 가능 (이력 관리)
- `rehab_exercises` 테이블과 1:N 관계 (하나의 플랜은 여러 운동 포함)

---

### 3.12 rehab_exercises (재활 운동 처방)

**목적:** 주차별 운동 처방

**주요 컬럼:**

- `week_number`: 1~4주차
- `exercise_id`: exercise_library 참조
- `sets`, `reps`: 세트/반복 횟수
- `special_notes`: 특별 지시사항

**비즈니스 로직:**

- 프론트엔드는 `exercise_id`로 `exercise_library` 조인
- 운동명, 영상 링크, 태그 정보 표시
- `sequence_order`로 정렬해서 표시 (`ORDER BY week_number, sequence_order`)
- 예: 1주차에 큐세팅(1), SLR(2), 스쿼트(3) 순서 보장

---

### 3.13 exercise_library (운동 라이브러리)

**목적:** 재활 운동 마스터 데이터 (Seed Data)

**설명:** 재활 운동의 마스터 데이터를 저장합니다. 앱 배포 시 미리 삽입됩니다.

**주요 컬럼:**
- `exercise_name`: 운동명 (unique)
- `category`: 무릎/어깨/허리/목/발목 등
- `difficulty_level`: EASY/MEDIUM/HARD
- `description`: 운동 설명
- `video_url`: 시연 영상 URL
- `thumbnail_url`: 썸네일 이미지 URL
- `tags`: **text[] 배열 (검색용 태그, 예: {스트레칭, 근력강화, 가동범위})**

**비즈니스 로직:**
- Seed Data로 50~100개 운동 미리 삽입
- LLM이 이 라이브러리에서 운동을 선택하여 처방
- **tags를 text[] 배열로 저장하는 이유:**
  - JSONB보다 배열 검색이 더 빠름
  - GIN 인덱스로 `WHERE 'tag_name' = ANY(tags)` 쿼리 최적화
  - PostgreSQL 배열 연산자 사용 가능

**인덱스:**
- `(category)`: 부위별 운동 조회
- `(difficulty_level)`: 난이도별 운동 조회
- `(tags) GIN`: **태그 검색 최적화 (예: "스트레칭" 태그가 있는 모든 운동)**

**예시 쿼리:**
```sql
-- "스트레칭" 태그가 있는 무릎 운동 검색
SELECT * FROM exercise_library
WHERE category = '무릎'
  AND '스트레칭' = ANY(tags);
```
---

### 3.14 exercise_completions (운동 완료 기록)

**목적:** 사용자의 운동 완료 기록 저장

**설명:** 사용자가 운동을 완료할 때마다 기록을 저장합니다. 데이터가 가장 빠르게 쌓이는 테이블입니다.

**주요 컬럼:**
- `user_id`: 사용자 참조 (FK)
- `rehab_exercise_id`: 재활 운동 참조 (FK)
- `rehab_plan_id`: **재활 계획 참조 (FK, 역정규화)**
- `completed_at`: 완료 시각
- `actual_sets`: 실제 수행한 세트 수
- `actual_reps`: 실제 수행한 반복 횟수
- `pain_level`: 통증 수준 (0~10)
- `notes`: 메모

**비즈니스 로직:**
- 사용자가 운동 완료 시 기록 생성
- **역정규화 이유:**
  - `rehab_plan_id`는 `rehab_exercises` 테이블을 조인하면 얻을 수 있음
  - 하지만 "이번 주 달성률" 계산 시 매번 조인하면 성능 저하
  - `rehab_plan_id`를 직접 저장하여 조인 없이 통계 쿼리 가능
- **데이터 일관성:**
  - 운동 완료 시 `rehab_exercises`에서 `rehab_plan_id`를 가져와 함께 저장
  - Application 레벨에서 보장 (Trigger 불필요)

**통계 쿼리 예시 (최적화 전 vs 후):**

**최적화 전 (조인 필요):**
```sql
SELECT COUNT(*) 
FROM exercise_completions ec
JOIN rehab_exercises re ON ec.rehab_exercise_id = re.id
WHERE re.rehab_plan_id = 123
  AND ec.completed_at >= '2024-03-01';
```
**최적화 후 (조인 불필요):**
```sql
SELECT COUNT(*) 
FROM exercise_completions
WHERE rehab_plan_id = 123
  AND completed_at >= '2024-03-01';
```

---

### 3.15 chat_sessions (챗봇 세션)

**목적:** 대화 세션 관리

**설명:** 챗봇 대화 세션을 관리합니다. 한 사용자가 여러 세션을 가질 수 있습니다.

**주요 컬럼:**
- `user_id`: 사용자 참조 (FK)
- `session_status`: 세션 상태 (ACTIVE, CLOSED)
- `related_guide_id`: 연관된 분석 리포트 ID (하위 호환용, Deprecated 예정)
- `context_type`: **컨텍스트 유형 ('GUIDE', 'EXERCISE', 'GENERAL')**
- `context_id`: **컨텍스트 ID (guide_result_id 또는 rehab_exercise_id)**

**비즈니스 로직:**
- 사용자가 챗봇 시작 시 새 세션 생성
- 30분 이상 입력 없으면 자동 CLOSED
- **컨텍스트 주입 로직:**
  - `context_type='GUIDE'`: `guide_results` 테이블에서 `context_id`로 전체 가이드 조회
  - `context_type='EXERCISE'`: `rehab_exercises` + `exercise_library` 조인하여 특정 운동 정보만 조회
  - `context_type='GENERAL'`: 컨텍스트 없이 일반 대화
- **토큰 최적화:**
  - 사용자가 "이 운동 어떻게 해요?"라고 물으면 `context_type='EXERCISE'`로 설정
  - 전체 가이드 대신 해당 운동 정보만 프롬프트에 주입 (토큰 절약)

**예시:**
```sql
-- 사용자가 "1주차 큐세팅 운동"에 대해 질문
INSERT INTO chat_sessions (user_id, context_type, context_id, session_status)
VALUES (123, 'EXERCISE', 456, 'ACTIVE');
-- context_id=456은 rehab_exercises.id
```

---

### 3.16 chat_messages (챗봇 메시지)

**목적:** 대화 이력 저장

**주요 컬럼:**

- `role`: user/assistant
- `content`: 메시지 내용

**비즈니스 로직:**

- LLM은 최근 5~10턴 이력을 참조해 응답
- 프론트엔드는 `created_at` 순으로 정렬 표시

---

### 3.17 notifications (알림) - 선택 사항

**목적:** 푸시 알림 및 인앱 알림 관리

**설명:** 가이드 생성 완료, 복약 리마인더, 운동 리마인더 등 알림을 저장합니다. 16일 프로젝트에서는 선택 사항입니다.

**주요 컬럼:**
- `user_id`: 사용자 참조 (FK)
- `notification_type`: 알림 유형 (GUIDE_READY/MEDICATION_REMINDER/EXERCISE_REMINDER/DEPLETION_WARNING)
- `title`: 알림 제목
- `message`: 알림 내용
- `related_id`: 관련 객체 ID (guide_result_id, medication_id 등)
- `is_read`: 읽음 여부 (기본값: false)
- `read_at`: 읽은 시각

**비즈니스 로직:**
- 가이드 생성 완료 시 알림 발송 (`notification_type='GUIDE_READY'`)
- 복약 시간 30분 전 알림 발송 (`notification_type='MEDICATION_REMINDER'`)
- 운동 시간에 알림 발송 (`notification_type='EXERCISE_REMINDER'`)
- 약물 소진 예정 시 알림 발송 (`notification_type='DEPLETION_WARNING'`)
- 프론트엔드는 `is_read=false`인 알림만 배지 표시

**구현 우선순위:**
- 16일 프로젝트에서는 **Low 우선순위**
- 시간 여유 있으면 구현
- 없어도 프로젝트 완성도에 큰 영향 없음

---

### 3.18 feedbacks (피드백 및 로그)

**목적:** 사용자 피드백 및 AI 성능 로그 수집 (REQ-019 대응)

**설명:** 챗봇 응답, 분석 결과, 운동 추천에 대한 사용자 피드백과 응답 속도를 기록합니다.

**주요 컬럼:**
- `target_type`: 피드백 대상 유형 ('GUIDE', 'CHAT', 'EXERCISE')
- `target_id`: 대상 ID (guide_result_id, message_id, exercise_id)
- `rating`: 1 (좋아요) or 0 (싫어요)
- `latency_ms`: 응답 속도 (밀리초)
- `comment`: 사용자 코멘트 (선택 사항)

**비즈니스 로직:**
- 모든 챗봇 응답에 좋아요/싫어요 버튼 표시
- `latency_ms`를 DB에 저장하여 P95 Latency 측정
- 발표 때 "평균 응답 속도 2.8초" 같은 데이터 제시 가능
- `rating = 0`인 응답은 프롬프트 개선 데이터로 활용

---

## 🔍 4. 인덱스 전략

### 4.1 필수 인덱스

```sql
-- 로그인 성능
CREATE INDEX idx_users_email ON users(email);

-- 사용자별 데이터 조회
CREATE INDEX idx_chronic_conditions_user ON chronic_conditions(user_id, condition_type);
CREATE INDEX idx_medications_user_active ON medications(user_id, is_active);
CREATE INDEX idx_documents_user_date ON documents(user_id, uploaded_at);
CREATE INDEX idx_guide_results_user_date ON guide_results(user_id, generated_at);

-- 약물 상호작용 필터링
CREATE INDEX idx_drug_interactions_severity ON drug_interactions(guide_result_id, severity);

-- 재활 운동 조회
CREATE INDEX idx_exercise_library_id ON exercise_library(exercise_id);
CREATE INDEX idx_exercise_library_area ON exercise_library(target_area);
CREATE INDEX idx_rehab_exercises_plan_week ON rehab_exercises(rehab_plan_id, week_number, sequence_order);

-- 챗봇 이력 조회
CREATE INDEX idx_chat_sessions_user_status ON chat_sessions(user_id, session_status);
CREATE INDEX idx_chat_messages_session_time ON chat_messages(session_id, created_at);
CREATE INDEX idx_chat_sessions_guide ON chat_sessions(related_guide_id);

-- OCR 확인 여부 조회 (분석 시작 전)
CREATE INDEX idx_ocr_confirmed ON ocr_results(document_id, is_confirmed);

-- 챗봇 세션의 연관 가이드 조회
CREATE INDEX idx_chat_guide ON chat_sessions(related_guide_id);

-- 활성 세션 조회 (이어하기)
CREATE INDEX idx_chat_user_status ON chat_sessions(user_id, session_status);

-- 재활 운동 순서 정렬
CREATE INDEX idx_rehab_sequence ON rehab_exercises(rehab_plan_id, week_number, sequence_order);

-- 운동 완료 기록 조회 (순응도 관리)
CREATE INDEX idx_completions_user_date ON exercise_completions(user_id, completed_at);
CREATE INDEX idx_completions_exercise ON exercise_completions(rehab_exercise_id, completed_at);

-- 알림 조회
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at);
```

---

## 5. 제약 조건 (Constraints)

### 5.1 NOT NULL 제약

```sql
-- 필수 입력 필드
users: email, password_hash, name, birth_date, gender
chronic_conditions: user_id, condition_type
medications: user_id, medication_name, dosage, frequency, medication_type
ocr_results: document_id, processing_status
guide_results: user_id
```

### 5.2 UNIQUE 제약

```sql
users.email                  -- 중복 가입 방지
exercise_library.exercise_id -- 운동 ID 중복 방지
```

### 5.3 CHECK 제약 (선택 사항)

```sql
ALTER TABLE users ADD CONSTRAINT chk_gender CHECK (gender IN ('M', 'F'));
ALTER TABLE chronic_conditions ADD CONSTRAINT chk_severity CHECK (severity IN ('경증', '중등도', '중증'));
ALTER TABLE drug_interactions ADD CONSTRAINT chk_severity CHECK (severity IN ('high', 'medium', 'low'));
ALTER TABLE ocr_results ADD CONSTRAINT chk_confidence CHECK (confidence_score BETWEEN 0 AND 1);
ALTER TABLE guide_results ADD CONSTRAINT chk_safety_score CHECK (overall_safety_score BETWEEN 0 AND 100);
```

---

## 6. Seed Data 준비

### 6.1 exercise_library (30개 운동)

```sql
INSERT INTO exercise_library (exercise_id, name, target_area, difficulty, contraindications, video_url, tags) VALUES
('knee01', '큐세팅', '무릎', 'low', ARRAY[]::text[], 'https://youtube.com/...', ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe']),
('knee02', 'SLR (다리 들기)', '무릎', 'medium', ARRAY['급성통증'], 'https://youtube.com/...', ARRAY['diabetes_safe', 'hypertension_safe']),
('knee03', '미니 스쿼트', '무릎', 'medium', ARRAY['골다공증', '급성통증'], 'https://youtube.com/...', ARRAY['diabetes_safe']),
('back01', '맥켄지 신전', '허리', 'medium', ARRAY['척추협착증'], 'https://youtube.com/...', ARRAY['diabetes_safe']),
('back02', '고양이-소 자세', '허리', 'low', ARRAY[]::text[], 'https://youtube.com/...', ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe']);
-- ... 총 30개
```

---

## 7. 보안 고려사항

### 7.1 민감 정보 암호화

```sql
-- 암호화 대상
medications.medication_name  -- AES-256
chronic_conditions.notes     -- AES-256
allergies.allergen_name      -- AES-256
```

### 7.2 파일 삭제 정책

```sql
-- documents 테이블
-- file_path: S3 Lifecycle 정책으로 24시간 후 자동 삭제
-- 원본 이미지는 저장하지 않고 OCR 결과만 저장
```

---

## 8. 예상 데이터 규모 (16일 프로젝트)

```
users: 10명 (테스트 계정)
chronic_conditions: 30건 (1인당 3개)
medications: 100건 (1인당 10개)
documents: 50건 (1인당 5개)
ocr_results: 50건
guide_results: 50건
drug_interactions: 150건 (1가이드당 3개)
medication_schedules: 200건 (1가이드당 4개)
rehab_plans: 50건
rehab_exercises: 200건 (1플랜당 4주 x 1~2개)
exercise_library: 30건 (Seed Data)
chat_sessions: 30건 (1인당 3세션)
chat_messages: 300건 (1세션당 10턴)
notifications: 100건 (선택 기능)

총 레코드 수: ~1,400건
```

---