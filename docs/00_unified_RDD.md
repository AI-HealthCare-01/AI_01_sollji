# 만성질환자 AI 건강 관리 서비스 — 통합 RDD (Refined Design Document)

**프로젝트명:** ChronicCare AI  
**버전:** v2.0 (실제 구현 기준 최종 정리)  
**작성일:** 2026-03-20  
**상태:** 구현 완료 (Phase 1)

---

## 1. 프로젝트 개요

### 1.1 배경 및 목적

만성질환자는 여러 병원에서 처방받은 약물을 동시에 복용하는 경우가 많아 약물 상호작용 위험에 노출되기 쉽다. 그러나 매번 의사나 약사에게 확인하기 어렵고, 기존 앱들은 단순 복약 알림 수준에 머물러 있다.

**ChronicCare AI**는 처방전 사진 한 장으로:
1. OCR로 약물 정보를 자동 추출하고
2. AI가 약물 상호작용을 분석하며
3. 개인 맞춤형 재활 운동을 추천하고
4. 챗봇으로 24시간 건강 상담을 제공한다.

### 1.2 핵심 가치

- **접근성:** 처방전 사진 한 장으로 즉시 분석
- **개인화:** 기저질환 + 복용 약물 + 알러지 기반 맞춤 분석
- **신뢰성:** temperature=0으로 일관된 AI 응답 (재활만 0.2)
- **확장성:** Mock 모드, pgvector 준비, S3 마이그레이션 대비 설계

### 1.3 기술 스택 선정 이유

#### Backend

| 기술 | 선정 이유 |
|------|---------|
| **FastAPI** | Python 기반 고성능 비동기 웹 프레임워크. 자동 OpenAPI 문서 생성, Pydantic 기반 타입 검증 |
| **SQLAlchemy 2.0 (async)** | 비동기 ORM. `asyncpg` + `psycopg[binary]` 드라이버로 PostgreSQL 비동기 연결 |
| **asyncpg + psycopg[binary]** | asyncpg: 고성능 비동기 드라이버 / psycopg: SQLAlchemy 내부 동기 연산 보완 |
| **BackgroundTasks** | FastAPI 내장 비동기 작업 처리. Celery 없이 OCR→분석 파이프라인 처리 가능 |
| **Redis 7.2** | 재활 플랜 캐싱. Graceful Degradation 적용 (Redis 연결 실패 시 캐싱 없이 정상 동작) |
| **JWT + bcrypt** | 무상태 인증. bcrypt로 비밀번호 단방향 해시 |
| **OpenAI GPT-4o-mini** | 약물 분석, 약물명 표준화, 재활 가이드 생성, 챗봇 전 기능에 활용 |
| **Naver Clova OCR** | 한글 처방전 특화 OCR. Mock 모드 지원으로 개발 시 API 비용 없이 테스트 가능 |
| **Mock 모드** | `USE_MOCK_OCR` / `USE_MOCK_ANALYSIS` / `USE_MOCK_CHAT` 환경변수로 외부 API 없이 전체 기능 테스트 가능 |

#### Frontend

| 기술 | 선정 이유 |
|------|---------|
| **React 19.2.0** | 최신 Concurrent 렌더링. 컴포넌트 기반 UI 구성 |
| **TypeScript 5.9** | 정적 타입으로 런타임 오류 사전 방지 |
| **Zustand 5.0.11** | Redux 대비 보일러플레이트 없음. `persist` 미들웨어 + `sessionStorage` 기반 인증 상태 유지 |
| **@tanstack/react-query 5** | 서버 상태 관리. 캐싱, 폴링, 리패치 자동 처리 |
| **react-router-dom v7** | SPA 클라이언트 사이드 라우팅 |
| **Tailwind CSS 3.4** | 유틸리티 클래스 기반 빠른 UI 개발 |
| **Vite 7** | 빠른 HMR 및 빌드 |
| **axios** | HTTP 클라이언트. JWT 인터셉터로 자동 토큰 주입 |

#### Infrastructure

| 기술 | 선정 이유 |
|------|---------|
| **Docker Compose** | 4개 서비스(postgres, redis, backend, frontend) 단일 명령으로 기동 |
| **pgvector/pgvector:pg15** | PostgreSQL 15 + pgvector 확장 포함 이미지. 현재 벡터 검색 미사용이나 향후 확장 대비 |

#### Out of Scope (미사용)

| 기술 | 제외 이유 |
|------|---------|
| Celery | FastAPI BackgroundTasks로 충분. 별도 워커 프로세스 불필요 |
| LangChain | OpenAI SDK 직접 사용. 추가 추상화 레이어 불필요 |
| AWS S3 | 로컬 `uploads/` 폴더로 충분 (Phase 2에서 S3 마이그레이션 예정) |
| Pinecone / 벡터 DB | `seed_knowledge.json` 직접 주입 방식 사용. pgvector 이미지는 Docker에 포함되어 있으나 벡터 검색 미구현 |
| RAG 파이프라인 | 현재 지식 규모에서 프롬프트 직접 주입으로 충분 |

---

## 2. 행위 주체 (Actors)

| 행위 주체 | 설명 |
|---------|------|
| **일반 사용자** | 만성질환자. 처방전 업로드, 분석 결과 확인, 챗봇 상담, 재활 운동 수행 |
| **FastAPI Backend** | REST API 제공, BackgroundTasks로 비동기 분석 처리 |
| **Naver Clova OCR** | 처방전 이미지 → 한글 텍스트 변환 |
| **OpenAI GPT-4o-mini** | 약물명 표준화, 약물 상호작용 분석, 재활 가이드 생성, 챗봇 응답 |
| **PostgreSQL** | 모든 영구 데이터 저장 (17개 테이블) |
| **Redis** | 재활 플랜 캐싱 (Graceful Degradation) |

---

## 3. 사용자 페르소나

### 페르소나 A — 김영희 (68세, 주부)

- **상황:** 고혈압 + 당뇨 + 골다공증으로 3개 병원에서 각각 처방받음
- **문제:** 약이 너무 많아서 어떤 약이 겹치는지, 같이 먹으면 안 되는 약이 있는지 모름
- **목표:** 처방전 사진 찍으면 바로 위험한 조합 알려주는 서비스
- **기술 수준:** 스마트폰 사용 가능, 복잡한 UI는 어려움

### 페르소나 B — 박민준 (45세, 직장인)

- **상황:** 허리디스크 수술 후 재활 중. 어떤 운동을 해야 할지 모름
- **문제:** 병원 재활치료는 비싸고 시간도 없음
- **목표:** 내 상태에 맞는 집에서 할 수 있는 운동 루틴
- **기술 수준:** 스마트폰/PC 모두 능숙

---

## 4. 시스템 아키텍처 (System Architecture)

### 4.1 전체 시스템 구조 (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                           │
│                                                                 │
│  React 19.2 + TypeScript + Vite 7                               │
│  ├── 상태관리: Zustand 5.0.11 (persist + sessionStorage)          │
│  ├── 서버 상태: @tanstack/react-query 5                           │
│  ├── 라우팅: react-router-dom v7                                 │
│  ├── HTTP: axios (JWT 인터셉터)                                   │
│  └── 스타일: Tailwind CSS 3.4                                     │
│                                                                 │
│  페이지 (11개):                                                   │
│  Landing · Login · Register · profileSetup · Dashboard          │
│  PrescriptionAnalysis · AnalysisResult · Rehabilitation         │
│  Chat · MyPage · HealthProfile                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (REST API / SSE)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                              │
│                                                                 │
│  FastAPI 0.115 + uvicorn                                        │
│  ├── /api/v1/auth       register · login · me · password · 탈퇴  │
│  ├── /api/v1/profile    conditions · medications · allergies    │
│  ├── /api/v1/documents  upload → uploads/ 로컬 저장               │
│  ├── /api/v1/analysis   분석 시작 · 상태 폴링 · 이력 · 삭제            │
│  ├── /api/v1/rehab      플랜 · 운동 · 완료 기록 · 진행률              │
│  ├── /api/v1/chat       일반 · SSE 스트리밍 · 세션 관리               │
│  └── /api/v1/feedback   제출 · 조회 · 삭제                          │
└──────┬───────────────────────────────────┬───────────────────────┘
       │                                   │
       ▼                                   ▼
┌──────────────────┐          ┌────────────────────────────────────┐
│   Data Layer     │          │          AI Worker Layer           │
│                  │          │                                    │
│  PostgreSQL      │          │  ocr_service.py                    │
│  (pgvector/      │          │  └─ Naver Clova OCR                │
│   pgvector:pg15) │◄─────────│     Mock 모드 지원                   │
│                  │          │                                    │
│  Redis 7.2       │          │  drug_normalizer.py                │
│  (캐싱,           │          │  └─ GPT-4o-mini (temperature=0)    │
│   Graceful       │          │     OCR 약물명 오타 보정/표준화          │
│   Degradation)   │          │                                    │
│                  │          │  analysis_service.py               │
│  uploads/        │          │  └─ GPT-4o-mini (temperature=0)    │
│  (처방전 이미지     │          │     약물 상호작용 분석                  │
│   임시 저장)       │          │                                    │
└──────────────────┘          │  rehab_service.py                  │
                              │  └─ GPT-4o-mini (temperature=0.2)  │
                              │     재활 가이드 생성                   │
                              │                                    │
                              │  chat_service.py                   │
                              │  └─ GPT-4o-mini (temperature=0)    │
                              │     SSE 스트리밍                     │
                              │     seed_knowledge.json 컨텍스트 주입 │
                              └────────────────────────────────────┘
```

### 4.2 데이터 플로우 (Data Flow)

#### 4.2.1 처방전 업로드 → 약물 분석 플로우

```
1. 사용자가 처방전 이미지 업로드

2. Frontend → POST /api/v1/documents/upload (이미지 파일)

3. Backend (ocr_service.py)
   ├─ 로컬 uploads/ 폴더에 이미지 저장 (24시간 후 자동 삭제)
   ├─ Naver Clova OCR API 호출
   └─ OCR 결과 파싱 (정규식)

4. DB 저장 (documents, ocr_results 테이블)

5. Frontend → OCR 결과 확인 화면 (사용자가 수정 가능)

6. 사용자가 "분석 시작" 버튼 클릭

7. Frontend → POST /api/v1/analysis/{document_id}

8. Backend → FastAPI BackgroundTasks로 비동기 처리 (즉시 202 반환)
   ├─ 기존 약물 조회 (medications 테이블)
   ├─ 신규 약물 조회 (ocr_results 테이블)
   ├─ drug_normalizer.py: OCR 약물명 표준화 (GPT-4o-mini, temperature=0)
   ├─ analysis_service.py: 약물 상호작용 분석 (GPT-4o-mini, temperature=0)
   ├─ rehab_service.py: 재활 가이드 생성 (GPT-4o-mini, temperature=0.2)
   └─ DB 저장 (guide_results, drug_interactions, rehab_plans 테이블)

9. Frontend → 폴링 (GET /api/v1/analysis/{guide_result_id}/status)
   └─ status: "pending" → 계속 폴링
   └─ status: "completed" → 결과 페이지 이동

10. 분석 완료 시 → 결과 페이지로 이동
```

#### 4.2.2 챗봇 질문 → 답변 플로우 (SSE 스트리밍)

```
1. 사용자가 챗봇 화면에서 질문 입력

2. Frontend → POST /api/v1/chat (세션 없을 경우 세션 생성 포함)

3. Backend → ChatSession 생성 (context_type, context_id 저장)

4. Frontend → POST /api/v1/chat/stream (SSE 스트리밍 요청)

5. Backend (chat_service.py)
   ├─ 컨텍스트 로드 (현재 보고 있는 분석 결과)
   ├─ 사용자 프로필 로드 (기저질환, 복용약)
   ├─ 분석 리포트 + seed_knowledge.json → 프롬프트에 직접 주입
   └─ GPT-4o-mini 호출 (stream=True, temperature=0)

6. Backend → SSE 스트리밍으로 청크 단위 전송
   data: {"chunk": "이부프로펜은"}\n\n
   data: {"chunk": " 어지러움을"}\n\n
   ...

7. Frontend → 실시간 텍스트 렌더링
```

### 4.3 컴포넌트 간 통신

#### 4.3.1 Frontend ↔ Backend 통신 규칙

```typescript
// src/api/client.ts — axios 인스턴스
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:8000/api/v1
  timeout: 30000,
});

// JWT 자동 주입 인터셉터
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

#### 4.3.2 SSE 스트리밍 수신

```typescript
// EventSource로 SSE 수신
const eventSource = new EventSource(
  `/api/v1/chat/stream?session_id=${sessionId}`
);
eventSource.onmessage = (e) => {
  const { chunk } = JSON.parse(e.data);
  setResponse((prev) => prev + chunk);
};
```

### 4.4 인프라 구성

#### 4.4.1 Docker Compose 구성

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg15      # pgvector 확장 포함
    ports: "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./data/init.sql:/docker-entrypoint-initdb.d/01_init.sql
      - ./data/seed_exercises.sql:/docker-entrypoint-initdb.d/02_seed_exercises.sql
    healthcheck: pg_isready

  redis:
    image: redis:7.2
    ports: "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck: redis-cli ping

  backend:
    build: ./chroniccare-backend/Dockerfile
    ports: "8000:8000"
    volumes:
      - ./chroniccare-backend/uploads:/app/uploads
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }

  frontend:
    build: ./chroniccare-frontend/Dockerfile
    ports: "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### 4.5 보안 아키텍처

| 계층 | 보안 조치 |
|------|---------|
| **인증** | JWT (HS256, python-jose). 토큰 만료 시 재로그인 |
| **비밀번호** | bcrypt 단방향 해시. 평문 저장 절대 금지 |
| **API 보호** | 모든 `/api/v1/*` 엔드포인트 JWT 필수 (로그인/회원가입 제외) |
| **파일 업로드** | 10MB 이하 이미지만 허용. uploads/ 폴더 격리 |
| **환경 변수** | `.env` 파일 `.gitignore` 처리. 값은 절대 코드에 하드코딩 금지 |
| **CORS** | FastAPI CORS 미들웨어로 허용 Origin 제한 |

### 4.6 성능 설계

#### 4.6.1 응답 시간 목표

| 기능 | 목표 | 실측 (temperature=0) |
|------|------|-------------------|
| OCR 처리 | < 5초 | - |
| 약물 상호작용 분석 | < 30초 (비동기) | 평균 2.27초 (GPT 응답만) |
| 재활 가이드 생성 | < 30초 (비동기) | - |
| 챗봇 첫 청크 | < 2초 | - |
| API 일반 응답 | < 200ms | - |

#### 4.6.2 캐싱 전략

```
Redis 캐싱 적용 대상:
- 재활 플랜 조회 (GET /api/v1/rehab/plans)
- TTL: 1시간

Graceful Degradation:
- Redis 연결 실패 시 캐싱 없이 DB 직접 조회
- 서비스 중단 없음
```

#### 4.6.3 비동기 처리 전략

| 처리 유형 | 구현 방식 | 적용 위치 |
|---------|---------|---------|
| OCR + AI 분석 파이프라인 | FastAPI BackgroundTasks | `POST /api/v1/analysis/{document_id}` |
| 챗봇 응답 스트리밍 | SSE (Server-Sent Events) | `POST /api/v1/chat/stream` (별도 엔드포인트) |
| DB 쿼리 | SQLAlchemy async + asyncpg | 전체 라우터 |
| Redis 캐싱 | redis-py async + Graceful Degradation | `GET /api/v1/rehab/plans` 등 |
| 외부 API 호출 | httpx (async) | ocr_service.py |

---

## 5. 핵심 기능 상세 설계

### 5.1 OCR 처리 로직

#### A. OCR 처리 플로우

```
입력: 처방전 이미지 (JPG/PNG, 10MB 이하)
  ↓
1. 이미지 유효성 검사
   - 파일 크기 ≤ 10MB
   - 지원 형식: JPG, PNG
  ↓
2. uploads/ 폴더에 임시 저장
  ↓
3. Naver Clova OCR API 호출
   - 한글 처방전 특화
   - 신뢰도(confidence) 점수 반환
  ↓
4. OCR 결과 파싱 (정규식)
   - 약물명, 용량, 복용 횟수 추출
  ↓
5. ocr_results 테이블 저장 (raw_text)
```

#### B. OCR 예외 처리

| 조건 | 처리 방법 | 사용자 메시지 |
|------|---------|------------|
| 신뢰도 ≤ 0.7 | 수정 요청 | "인식 정확도가 낮습니다. 확인해주세요" |
| OCR API 실패 | 3회 재시도 | "인식 실패, 직접 입력해주세요" |
| 이미지 용량 초과 | 업로드 거부 | "10MB 이하 이미지만 가능합니다" |

### 5.2 AI 분석 로직

#### B. 약물 상호작용 분석 로직

**[입력]**
- OCR 추출 텍스트 (raw_text)
- 사용자 기저질환 목록 (chronic_conditions)
- 사용자 기존 복용 약물 (medications)
- 사용자 알러지 (allergies)

**[처리 단계]**

```
1. drug_normalizer.py
   → GPT-4o-mini (temperature=0)
   → OCR 오타/약어 보정
   → 약물명 표준화
     예: "타이레놀정500" → "아세트아미노펜 500mg"

2. analysis_service.py
   → GPT-4o-mini (temperature=0)
   → 표준화된 약물명 + 사용자 컨텍스트 주입
   → 상호작용 분석, 복약 시간표 생성
```

**[출력]**
- `drug_interactions` 테이블 저장 (medication_a, medication_b, severity)
- `medication_schedules` 테이블 저장 (schedule_date: JSONB)
- `guide_results.overall_safety_score` ⚠️ 현재 항상 0으로 하드코딩, 계산 로직 미구현

**성능 검증 결과 (temperature=0 적용):**

| 실행 횟수 | 위험도 분류 | 상호작용 감지 | 응답 시간 |
|---------|-----------|------|---------|
| 1회 | Medium | 감지 | 2.3초 |
| 2회 | Medium | 감지 | 2.1초 |
| 3회 | Medium | 감지 | 2.4초 |

→ 동일 입력 일관성 100%, 평균 응답 2.27초

**프롬프트 버전 비교:**

| 버전 | 프롬프트 전략 | 상호작용 감지율 | 오탐율 |
|------|-----------|-------------|------|
| v1 | 단순 나열 | 70% | 15% |
| v2 | 구조화 + 역할 부여 + JSON 강제 | 92% | 5% |

#### C. 재활 가이드 생성 로직

**[입력]**
- `guide_results` (분석 완료된 약물 정보)
- 사용자 기저질환 목록
- `exercise_library` (seed_exercises.sql로 사전 로딩된 운동 DB)

**[처리]**

```
rehab_service.py
→ GPT-4o-mini (temperature=0.2)
  ※ 재활만 0.2 적용: 동일 환자에게 매번 약간 다른 운동 조합 제공
→ 대상 부위별 운동 처방 생성
→ exercise_library에서 실제 운동 매핑
```

**[출력]**
- `rehab_plans` 테이블 저장 (target_area, is_active)
- `rehab_exercises` 테이블 저장 (plan ↔ exercise 매핑)

#### D. AI 챗봇 로직 (컨텍스트 직접 주입 방식)

**전략:** 데이터 양이 적으므로 (Text < 100KB), 벡터 DB 없이 프롬프트에 컨텍스트를 직접 주입하여 개발 속도와 정확도 확보.

**처리:**
```
1. 사용자의 분석 리포트 조회 (DB)
2. 운동 라이브러리 전체 조회 (DB)
3. 프롬프트에 컨텍스트 직접 주입
4. GPT-4o-mini SSE 스트리밍 호출 (POST /api/v1/chat/stream)
```

**LLM 프롬프트 (System Prompt 구성):**

```
System: 너는 물리치료사야. 아래 환자 정보와 분석 리포트를 보고 답변해.

Context:
[환자 프로필]
질환: 골다공증
복용약: 이부프로펜

[현재 분석 리포트]
위험도: 주의
금기사항: 낙상 주의
```

---

## 6. 기능적 요구사항

### Tier 1 — 필수 기능 (Must Have)

| REQ ID | 기능 | 설명 | 우선순위 |
|--------|------|------|---------|
| REQ-001 | 회원가입 | 이메일, 비밀번호(bcrypt), 이름, 생년월일, 성별, 전화번호 | High |
| REQ-002 | 로그인/로그아웃 | JWT 발급, Zustand persist + sessionStorage 저장 | High |
| REQ-003 | 회원 정보 수정 | PATCH /api/v1/auth/me | High |
| REQ-020 | 회원 탈퇴 | DELETE /api/v1/auth/me | High |
| REQ-021 | 비밀번호 변경 | PATCH /api/v1/auth/me/password | High |
| REQ-004 | 건강 프로필 입력 | 기저질환, 복용 약물(표준화명 포함), 알러지 4단계 입력 | High |
| REQ-005 | 처방전 업로드 | 이미지 업로드 → uploads/ 로컬 저장 | High |
| REQ-006 | OCR 처리 | Naver Clova OCR → 한글 텍스트 추출 | High |
| REQ-007 | 약물명 표준화 | drug_normalizer.py → GPT-4o-mini로 OCR 오타 보정 | High |
| REQ-008 | 약물 상호작용 분석 | GPT-4o-mini (temperature=0) → drug_interactions 저장 | High |
| REQ-009 | 복약 시간표 생성 | medication_schedules.schedule_date (JSONB) 저장 | High |
| REQ-010 | 분석 상태 폴링 | GET /api/v1/analysis/{id}/status | High |
| REQ-011 | 재활 가이드 생성 | GPT-4o-mini (temperature=0.2) → rehab_plans, rehab_exercises 저장 | High |
| REQ-012 | 운동 라이브러리 | seed_exercises.sql로 사전 로딩, exercise_library 테이블 | High |
| REQ-013 | 운동 완료 기록 | exercise_completions 테이블 저장 | High |
| REQ-014 | AI 챗봇 | GPT-4o-mini (temperature=0) + seed_knowledge.json 컨텍스트 주입 | High |
| REQ-015 | SSE 스트리밍 챗봇 | POST /api/v1/chat/stream (별도 엔드포인트) | High |
| REQ-016 | 챗봇 세션 관리 | chat_sessions, chat_messages 테이블 | High |

### Tier 2 — 중요 기능 (Should Have)

| REQ ID | 기능 | 설명 | 우선순위 |
|--------|------|------|---------|
| REQ-017 | 분석 이력 조회 | GET /api/v1/analysis/history | Medium |
| REQ-018 | 재활 진행률 | GET /api/v1/rehab/plans/{id}/progress | Medium |
| REQ-019 | 피드백 수집 | feedbacks 테이블 (rating, latency_ms 포함) | Medium |
| REQ-022 | Mock 모드 | USE_MOCK_OCR / USE_MOCK_ANALYSIS / USE_MOCK_CHAT 환경변수 | Medium |

### Tier 3 — 선택 기능 (Optional)

| REQ ID | 기능 | 설명 | 우선순위 |
|--------|------|------|---------|
| REQ-023 | 안전 점수 표시 | overall_safety_score (DB 컬럼 존재, API 응답 포함, 계산 로직 미구현 — 항상 0) | Low |
| REQ-024 | 복약 리마인더 알림 | notifications 테이블 설계 완료, 발송 로직 미구현 | Low |
| REQ-025 | pgvector 벡터 검색 | Docker 이미지에 포함, 기능 미구현 (현재 seed_knowledge.json 직접 주입) | Low |

---

## 7. 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| **성능** | 일반 API 응답 < 200ms, AI 분석 < 30초 (비동기), 챗봇 첫 청크 < 2초 |
| **가용성** | Redis 장애 시 Graceful Degradation으로 서비스 중단 없음 |
| **보안** | JWT 인증, bcrypt 해시, 환경변수 분리, 파일 업로드 제한 |
| **확장성** | 서비스 레이어 분리, Docker Compose, Mock 모드, pgvector 준비 |
| **유지보수성** | routers / services / models 완전 분리, 환경변수 기반 설정 |
| **테스트** | Mock 모드 3종으로 외부 API 없이 전체 기능 테스트 가능 |

---

## 8. 데이터베이스 설계

### 8.1 설계 원칙

- 모든 테이블 PK는 `id` (Integer, Auto Increment) 사용
  - 예외: `exercise_library.exercise_id` (String PK — Seed Data 식별자)
- 모든 테이블 `created_at`, `updated_at` 자동 관리
- 외래키 참조 무결성 보장
- JSONB 타입: `medication_schedules.schedule_date`

### 8.2 핵심 테이블 목록 (17개)

#### Tier 1 — 필수 (13개)

| 테이블명 | 설명 | 주요 관계 컬럼 |
|---------|------|-------------|
| `users` | 사용자 | id, email, password_hash, name, birth_date, gender, phone |
| `health_profiles` | 건강 프로필 | id, user_id → users |
| `chronic_conditions` | 만성질환 | id, user_id → users, condition_type |
| `medications` | 복용 약물 | id, user_id → users, medication_name, **standardized_name**, is_active |
| `allergies` | 알러지 | id, user_id → users, allergen_name |
| `documents` | 업로드 문서 | id, user_id → users, document_type, file_path |
| `ocr_results` | OCR 결과 | id, document_id → documents, raw_text |
| `guide_results` | AI 분석 결과 | id, user_id → users, ocr_result_id → ocr_results, status, overall_safety_score (항상 0) |
| `drug_interactions` | 약물 상호작용 | id, guide_result_id → guide_results, medication_a, medication_b, severity |
| `medication_schedules` | 복약 시간표 | id, guide_result_id → guide_results, user_id → users, schedule_date **(JSONB)** |
| `exercise_library` | 운동 라이브러리 | exercise_id **(PK, String)**, exercise_name, category, difficulty_level |
| `rehab_plans` | 재활 계획 | id, user_id → users, guide_result_id → guide_results, target_area, is_active |
| `rehab_exercises` | 재활 운동 처방 | id, rehab_plan_id → rehab_plans, exercise_id → exercise_library |

#### Tier 2 — 중요 (4개)

| 테이블명 | 설명 | 주요 관계 컬럼 |
|---------|------|-------------|
| `exercise_completions` | 운동 완료 기록 | id, user_id → users, rehab_exercise_id → rehab_exercises, rehab_plan_id → rehab_plans, completed_date |
| `chat_sessions` | 채팅 세션 | id, user_id → users, related_guide_id → guide_results, context_type, session_status |
| `chat_messages` | 채팅 메시지 | id, session_id → chat_sessions, role, content |
| `feedbacks` | 피드백 | id, user_id → users, target_type, target_id, rating, **latency_ms** |

#### Tier 3 — Phase 2 예정 (1개)

| 테이블명 | 설명 | 주요 관계 컬럼 |
|---------|------|-------------|
| `notifications` | 알림 | id, user_id → users, notification_type, is_read |

### 8.3 ERD 관계도

```
users (1) ─────┬──── (N) chronic_conditions
               ├──── (N) medications
               ├──── (N) allergies
               ├──── (1) health_profiles
               ├──── (N) documents
               ├──── (N) guide_results
               ├──── (N) chat_sessions
               ├──── (N) exercise_completions
               ├──── (N) feedbacks
               └──── (N) notifications

documents (1) ──── (1) ocr_results

ocr_results (1) ──── (N) guide_results

guide_results (1) ─┬─ (N) drug_interactions
                   ├─ (N) medication_schedules
                   ├─ (N) rehab_plans
                   └─ (N) chat_sessions

rehab_plans (1) ──── (N) rehab_exercises

rehab_exercises (N) ──── (1) exercise_library
rehab_exercises (1) ──── (N) exercise_completions
```

---

## 9. 에러 처리 전략

### 9.1 HTTP 에러 코드 체계

| 코드 | 상황 | 예시 |
|------|------|------|
| 400 | 잘못된 요청 | 이미지 형식 오류, 필수 필드 누락 |
| 401 | 인증 실패 | JWT 만료, 토큰 없음 |
| 403 | 권한 없음 | 다른 사용자 데이터 접근 시도 |
| 404 | 리소스 없음 | 존재하지 않는 guide_result_id |
| 409 | 충돌 | 이미 등록된 이메일 |
| 422 | 유효성 검사 실패 | Pydantic 스키마 불일치 |
| 500 | 서버 오류 | DB 연결 실패, 예상치 못한 예외 |

### 9.2 외부 API 에러 처리

| 서비스 | 에러 유형 | 처리 방법 |
|--------|---------|---------|
| Naver Clova OCR | API 실패 | 3회 재시도 후 실패 시 사용자에게 직접 입력 유도 |
| Naver Clova OCR | 신뢰도 낮음 | 사용자에게 수정 요청 |
| OpenAI GPT | API 실패 | 에러 메시지 반환, guide_results.status = "failed" |
| Redis | 연결 실패 | Graceful Degradation — 캐싱 없이 DB 직접 조회 |

### 9.3 Frontend 에러 처리

```typescript
// axios 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 10. 검수 체크리스트

### 10.1 기능 검수

```
□ 회원가입 → 로그인 → JWT 발급
□ 기저질환 / 약물(표준화명 포함) / 알러지 입력 및 저장
□ 회원 정보 수정 (PATCH /auth/me)
□ 비밀번호 변경 (PATCH /auth/me/password)
□ 회원 탈퇴 (DELETE /auth/me)
□ 처방전 이미지 업로드 → uploads/ 저장 확인
□ OCR 처리 → ocr_results 저장
□ drug_normalizer 약물명 표준화 동작 확인
□ 분석 시작 → BackgroundTasks 비동기 처리
□ 분석 상태 폴링 (GET /analysis/{id}/status)
□ 분석 완료 → drug_interactions, medication_schedules 저장
□ overall_safety_score = 0 반환 확인 (미구현 명시)
□ 재활 플랜 생성 (temperature=0.2)
□ 운동 완료 기록 → exercise_completions 저장
□ 챗봇 일반 응답 (POST /chat)
□ 챗봇 SSE 스트리밍 (POST /chat/stream 별도 엔드포인트)
□ 챗봇 세션 종료 (PATCH /chat/sessions/{id}/end)
□ 피드백 제출 → latency_ms 기록 확인
□ Redis 캐싱 동작 (재활 플랜 조회)
□ Redis 연결 실패 시 Graceful Degradation 확인
```

### 10.2 Mock 모드 검수

```
□ USE_MOCK_OCR=true → Naver Clova 호출 없이 고정 결과 반환
□ USE_MOCK_ANALYSIS=true → GPT 호출 없이 고정 분석 결과 반환
□ USE_MOCK_CHAT=true → GPT 호출 없이 고정 챗봇 응답 반환
□ 프로덕션 배포 시 3개 모두 false 확인
```

### 10.3 인프라 검수

```
□ docker-compose up -d → 4개 서비스 모두 healthy
□ pgvector/pgvector:pg15 이미지 정상 기동
□ init.sql → 17개 테이블 생성 확인
□ seed_exercises.sql → exercise_library 데이터 로딩 확인
□ uploads/ 볼륨 마운트 확인
□ redis_data 볼륨 마운트 확인
□ OPENAI_API_KEY 설정 확인
□ CLOVA_OCR_SECRET / CLOVA_OCR_APIGW_URL 설정 확인
```

---

## 11. 개발 일정 (실제 완료 기준)

| Phase | 기간 | 완료 항목 |
|-------|------|---------|
| **Phase 0** | 1주차 | 프로젝트 구조 설계, Docker Compose, DB 스키마, Seed Data |
| **Phase 1** | 2~3주차 | 인증, 건강 프로필, OCR, 약물 분석, 재활 가이드 |
| **Phase 2** | 4주차 | 챗봇 (SSE 스트리밍), 피드백, Mock 모드 |
| **Phase 3** | 5주차 | 통합 테스트, 문서화, 배포 |

---

## 12. 성공 지표 (KPI)

| 지표 | 목표 | 측정 방법 |
|------|------|---------|
| OCR 인식 정확도 | ≥ 90% | 신뢰도 점수 평균 |
| 약물 상호작용 감지율 | ≥ 92% | v2 프롬프트 기준 |
| 약물 상호작용 오탐율 | ≤ 5% | v2 프롬프트 기준 |
| AI 분석 일관성 | 100% | temperature=0, 동일 입력 3회 반복 |
| 챗봇 응답 만족도 | ≥ 4.0/5.0 | feedbacks.rating 평균 |
| API 평균 응답 시간 | < 200ms | feedbacks.latency_ms 평균 |

---

## 13. 기술 스택 상세

### 13.1 Backend (Python 3.11+) — requirements.txt

```txt
# Web Framework
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-multipart==0.0.12

# Database
sqlalchemy==2.0.35
psycopg[binary]==3.2.4
asyncpg==0.30.0
alembic==1.13.3

# Redis
redis==5.1.1

# Settings
pydantic-settings==2.5.2
pydantic[email]==2.12.5

# AI / LLM
openai==1.51.0

# Utils
python-dotenv==1.0.1
python-jose[cryptography]==3.3.0
bcrypt==4.0.1
httpx==0.27.2

greenlet>=3.0.0
email-validator>=2.0.0
```

### 13.2 Frontend (Node 20+) — package.json

**dependencies:**
```json
{
  "@tanstack/react-query": "^5.90.21",
  "axios": "^1.13.5",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.13.1",
  "zustand": "^5.0.11"
}
```

**devDependencies:**
```json
{
  "@eslint/js": "^9.39.1",
  "@types/node": "^24.10.15",
  "@types/react": "^19.2.7",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^5.1.1",
  "autoprefixer": "^10.4.27",
  "eslint": "^9.39.1",
  "eslint-plugin-react-hooks": "^7.0.1",
  "eslint-plugin-react-refresh": "^0.4.24",
  "globals": "^16.5.0",
  "postcss": "^8.5.6",
  "tailwindcss": "^3.4.19",
  "typescript": "~5.9.3",
  "typescript-eslint": "^8.48.0",
  "vite": "^7.3.1"
}
```

---

## 14. 환경 변수 (Environment Variables)

> ⚠️ 값은 절대 Git에 커밋하지 않는다. `.env` 파일은 `.gitignore`에 반드시 포함.

### 14.1 Backend 환경 변수 (config.py 기준)

```bash
# 앱 설정
APP_ENV=development          # development | production
SECRET_KEY=...               # JWT 서명 키 (최소 32자 랜덤 문자열)
DEBUG=true

# PostgreSQL
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=chroniccare
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379/0

# OpenAI
OPENAI_API_KEY=sk-...

# Naver Clova OCR
CLOVA_OCR_SECRET=...
CLOVA_OCR_APIGW_URL=https://...

# Mock 모드 (개발/테스트 시 외부 API 호출 없이 동작)
USE_MOCK_OCR=false
USE_MOCK_ANALYSIS=false
USE_MOCK_CHAT=false
```

### 14.2 Frontend 환경 변수 (docker-compose.yml 기준)

```bash
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 15. 프로젝트 디렉토리 구조

### 15.1 전체 구조

```
AI_Health_final/
├── chroniccare-backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # 환경 변수 설정
│   │   │   ├── database.py        # SQLAlchemy 비동기 엔진
│   │   │   ├── redis_client.py    # Redis 캐싱 (Graceful Degradation)
│   │   │   └── security.py        # JWT, bcrypt
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── document.py
│   │   │   ├── analysis.py
│   │   │   ├── chat.py
│   │   │   └── rehab.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── profile.py
│   │   │   ├── documents.py
│   │   │   ├── analysis.py
│   │   │   ├── rehab.py
│   │   │   ├── chat.py
│   │   │   └── feedback.py
│   │   ├── services/
│   │   │   ├── analysis_service.py   # GPT-4o-mini, temperature=0
│   │   │   ├── chat_service.py       # GPT-4o-mini, stream=True, temperature=0
│   │   │   ├── ocr_service.py        # Naver Clova OCR
│   │   │   ├── drug_normalizer.py    # GPT-4o-mini, temperature=0 (약물명 표준화)
│   │   │   ├── profile_service.py    # DB CRUD만 (외부 API 없음)
│   │   │   └── rehab_service.py      # GPT-4o-mini, temperature=0.2
│   │   ├── error_codes.py
│   │   ├── main.py
│   │   └── __init__.py
│   ├── uploads/                      # 처방전 이미지 로컬 저장 (24h 후 삭제)
│   ├── requirements.txt
│   └── Dockerfile
├── chroniccare-frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts            # axios 인스턴스 + JWT 인터셉터
│   │   │   └── profileApi.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── TopNav.tsx
│   │   │   ├── profile/
│   │   │   │   ├── Step1_BasicInfo.tsx
│   │   │   │   ├── Step2_Conditions.tsx
│   │   │   │   ├── Step3_Medications.tsx
│   │   │   │   ├── Step4_Allergies.tsx
│   │   │   │   └── StepIndicator.tsx
│   │   │   └── ui/                  # (비어있음)
│   │   ├── hooks/
│   │   │   ├── useAnalysis.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── useProfile.ts
│   │   │   └── useRehab.ts
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── profileSetup.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PrescriptionAnalysis.tsx
│   │   │   ├── AnalysisResult.tsx
│   │   │   ├── Rehabilitation.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── MyPage.tsx
│   │   │   └── HealthProfile.tsx
│   │   ├── store/
│   │   │   └── authStore.ts         # Zustand + persist (sessionStorage)
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/                   # (비어있음)
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── Dockerfile
├── data/
│   ├── init.sql                     # DB 초기화 스크립트
│   └── seed_exercises.sql           # 운동 라이브러리 Seed Data
├── docker-compose.yml
└── README.md
```

---

## 16. 외부 서비스 및 API

### 16.1 외부 API 목록

| 서비스 | 용도 | 과금 | 비고 |
|--------|------|------|------|
| **OpenAI GPT-4o-mini** | 약물 분석, 약물명 표준화, 재활 가이드 생성, 챗봇 | 유료 (종량제) | temperature=0 (재활만 0.2) |
| **Naver Clova OCR** | 처방전 한글 텍스트 인식 | 유료 (종량제) | Mock 모드 지원 |

> ℹ️ AWS S3, Pinecone, LangChain, Celery는 **미사용** (코드에 없음)

### 16.2 Mock 모드 (개발/테스트 전용)

외부 API 비용 없이 개발 및 테스트할 수 있도록 Mock 구현체가 존재한다.

| 환경 변수 | 대상 | 동작 |
|----------|------|------|
| `USE_MOCK_OCR=true` | Naver Clova OCR | 고정 OCR 결과 반환 |
| `USE_MOCK_ANALYSIS=true` | GPT-4o-mini (분석) | 고정 분석 결과 반환 |
| `USE_MOCK_CHAT=true` | GPT-4o-mini (챗봇) | 고정 챗봇 응답 반환 |

---

## 17. 데이터베이스 스키마 상세 (실제 구현 기준)

### 17.1 전체 테이블 목록 (17개)

**Tier 1 — 필수 (13개):**

| 테이블명 | 설명 | 주요 관계 컬럼 |
|---------|------|-------------|
| `users` | 사용자 | id, email, password_hash, name, birth_date, gender, phone |
| `health_profiles` | 건강 프로필 | id, user_id → users |
| `chronic_conditions` | 만성질환 | id, user_id → users, condition_type |
| `medications` | 복용 약물 | id, user_id → users, medication_name, standardized_name, is_active |
| `allergies` | 알러지 | id, user_id → users, allergen_name |
| `documents` | 업로드 문서 | id, user_id → users, document_type, file_path |
| `ocr_results` | OCR 결과 | id, document_id → documents, raw_text |
| `guide_results` | AI 분석 결과 | id, user_id → users, ocr_result_id → ocr_results, status, **overall_safety_score** (항상 0, 미구현) |
| `drug_interactions` | 약물 상호작용 | id, guide_result_id → guide_results, medication_a, medication_b, severity |
| `medication_schedules` | 복약 시간표 | id, guide_result_id → guide_results, user_id → users, schedule_date (JSONB) |
| `exercise_library` | 운동 라이브러리 (Seed) | exercise_id (PK, String), exercise_name, category, difficulty_level |
| `rehab_plans` | 재활 계획 | id, user_id → users, guide_result_id → guide_results, target_area, is_active |
| `rehab_exercises` | 재활 운동 처방 | id, rehab_plan_id → rehab_plans, exercise_id → exercise_library |

**Tier 2 — 중요 (4개):**

| 테이블명 | 설명 | 주요 관계 컬럼 |
|---------|------|-------------|
| `exercise_completions` | 운동 완료 기록 | id, user_id → users, rehab_exercise_id → rehab_exercises, rehab_plan_id → rehab_plans, completed_date |
| `chat_sessions` | 채팅 세션 | id, user_id → users, related_guide_id → guide_results, context_type, session_status |
| `chat_messages` | 채팅 메시지 | id, session_id → chat_sessions, role, content |
| `feedbacks` | 피드백 | id, user_id → users, target_type, target_id, rating, **latency_ms** |

**Tier 3 — 설계 완료, Phase 2 구현 예정 (1개):**

| 테이블명 | 설명 | 주요 관계 컬럼 |
|---------|------|-------------|
| `notifications` | 알림 | id, user_id → users, notification_type, is_read |

### 17.2 ERD 관계도

```
users (1) ─────┬──── (N) chronic_conditions
               ├──── (N) medications
               ├──── (N) allergies
               ├──── (1) health_profiles
               ├──── (N) documents
               ├──── (N) guide_results
               ├──── (N) chat_sessions
               ├──── (N) exercise_completions
               ├──── (N) feedbacks
               └──── (N) notifications

documents (1) ──── (1) ocr_results

ocr_results (1) ──── (N) guide_results

guide_results (1) ─┬─ (N) drug_interactions
                   ├─ (N) medication_schedules
                   ├─ (N) rehab_plans
                   └─ (N) chat_sessions

rehab_plans (1) ──── (N) rehab_exercises

rehab_exercises (N) ──── (1) exercise_library
rehab_exercises (1) ──── (N) exercise_completions
```

---

## 18. 확장성 설계

### 18.1 현재 적용된 확장 구조

- **OCR 서비스 추상화:** `USE_MOCK_OCR` 환경변수 변경만으로 OCR 엔진 교체 가능
  (현재: Naver Clova OCR → 향후: Google Vision, AWS Textract)
- **서비스 레이어 분리:** `routers ↔ services ↔ models` 완전 분리
  → 비즈니스 로직 변경 시 라우터 수정 불필요
- **Docker Compose 구조:** 서비스별 독립 컨테이너
  → 향후 Kubernetes 마이그레이션 용이
- **Redis Graceful Degradation:** Redis 연결 실패 시 캐싱 없이 정상 동작
  → 인프라 장애에도 서비스 중단 없음
- **notifications 테이블:** 설계 완료, Phase 2 구현 예정

### 18.2 Phase 2/3 확장 계획

| 기능 | 현재 | 확장 방향 |
|------|------|---------|
| 이미지 저장 | 로컬 `uploads/` | AWS S3 (환경변수만 변경) |
| 알림 서비스 | 테이블만 존재 | 복약 리마인더 푸시 알림 |
| 안전 점수 | DB 컬럼 존재, 항상 0 | LLM 프롬프트에 계산 로직 추가 |
| 모바일 앱 | 웹만 | REST API 구조로 클라이언트 독립 확장 |
| 벡터 검색 | seed_knowledge.json 직접 주입 | 데이터 증가 시 pgvector 활용 (이미 Docker에 설치됨) |

---

## 19. 피드백 활용 구조

### 19.1 수집 → 저장 → 분석 → 개선 사이클

```
1. 사용자 피드백 수집
   - 챗봇 응답마다 좋아요/싫어요 버튼
   - rating (1~5점)
   - 응답 속도 자동 측정 (latency_ms)

2. feedbacks 테이블에 저장
   - target_type: "chat_message" | "analysis" | "rehab_plan"
   - target_id: 해당 콘텐츠 ID
   - rating: 1~5
   - latency_ms: 응답 속도 (ms)

3. 부정 피드백 패턴 분석
   예: rating <= 2인 응답의 공통 패턴 파악
   → "재활 운동이 너무 어렵다" 피드백 다수
   → 난이도 조절 프롬프트 파라미터 추가

4. 개선된 프롬프트로 다음 분석에 적용
```

### 19.2 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/v1/feedback` | 피드백 제출 |
| GET | `/api/v1/feedback` | 피드백 목록 조회 |
| GET | `/api/v1/feedback/{feedback_id}` | 피드백 상세 조회 |
| DELETE | `/api/v1/feedback/{feedback_id}` | 피드백 삭제 |

---

## 20. 배포 후 확인 체크리스트

### 20.1 서비스 기동 확인

```bash
# 전체 서비스 시작
docker-compose up -d

# 서비스 상태 확인 (4개 모두 healthy)
docker-compose ps

# 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend

# DB 초기화 확인 (init.sql + seed_exercises.sql 자동 실행)
docker-compose logs postgres
```

### 20.2 배포 후 확인 항목

```
□ postgres 컨테이너 healthy 상태
□ redis 컨테이너 healthy 상태
□ backend 컨테이너 healthy 상태 (GET /health → 200)
□ frontend 컨테이너 정상 기동 (http://localhost:5173)
□ DB 테이블 17개 생성 확인
□ exercise_library Seed Data 로딩 확인 (seed_exercises.sql)
□ uploads/ 폴더 마운트 확인
□ Mock 모드 환경변수 확인 (프로덕션 시 모두 false)
□ OPENAI_API_KEY 설정 확인
□ CLOVA_OCR_SECRET 설정 확인
```

### 20.3 기능 동작 확인

```
□ 회원가입 → 로그인 → JWT 발급
□ 기저질환/약물/알러지 입력 및 저장
□ 처방전 이미지 업로드 → uploads/ 저장 확인
□ OCR 처리 → 결과 반환
□ 분석 시작 → BackgroundTasks 비동기 처리
□ 분석 상태 폴링 (GET /analysis/{id}/status)
□ 분석 완료 → 결과 페이지 이동
□ 챗봇 SSE 스트리밍 동작 (POST /chat/stream)
□ 피드백 제출 (POST /feedback)
□ Redis 캐싱 동작 (재활 플랜 조회 속도 비교)
```

---

## 21. 알려진 미구현 사항 (Known Limitations)

| 항목 | 상태 | 상세 |
|------|------|------|
| **안전 점수 계산** | ❌ 미구현 | `overall_safety_score` DB 컬럼 존재, API 응답에 포함되나 항상 0으로 하드코딩. LLM 프롬프트에 계산 지시 없음 |
| **복약 리마인더 알림** | ❌ 미구현 | `notifications` 테이블 설계 완료, 실제 알림 발송 로직 없음 |
| **pgvector 활용** | ❌ 미구현 | Docker에 `pgvector/pgvector:pg15` 이미지 사용 중이나 벡터 검색 기능 미구현. 현재는 `seed_knowledge.json` 직접 주입 방식 사용 |
| **이미지 자동 삭제** | ⚠️ 미확인 | `uploads/` 폴더 24시간 후 자동 삭제 스케줄러 구현 여부 미확인 |
| **프론트 폴링 로직** | ⚠️ 미확인 | `useAnalysis.ts` 존재하나 실제 폴링 간격 미확인 |
```

---
