

---


# ChronicCare Ortho

> AI 기반 만성질환자 맞춤형 통합 복약·재활 관리 시스템

만성질환(당뇨/고혈압/골다공증) 환자가 정형외과 치료를 받을 때, 
OCR 기반 처방전 분석과 AI 가이드를 통해 안전한 복약 및 재활을 지원하는 헬스케어 플랫폼입니다.

---

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [API 엔드포인트](#api-엔드포인트)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [개발 로드맵](#개발-로드맵)
- [문서](#문서)
- [면책 조항](#면책-조항)

---

## 프로젝트 개요

### 배경 및 목적

만성질환자가 정형외과 수술/시술을 받을 때, 기존 복용 약물과 신규 처방약 간의 상호작용 위험이 있으며, 기저질환을 고려하지 않은 재활 운동은 오히려 건강을 악화시킬 수 있습니다.

**ChronicCare Ortho**는 이러한 문제를 해결하기 위해:
- OCR 기술로 처방전을 자동 인식
- GPT-4 기반 AI로 약물 상호작용 분석
- 맞춤형 재활 가이드 생성
- Full Injection 방식 챗봇으로 24시간 상담 지원

을 제공하는 통합 헬스케어 플랫폼입니다.

### 핵심 가치

- **안전성**: 약물 상호작용 사전 경고로 부작용 예방
- **맞춤화**: 개인의 기저질환을 고려한 재활 프로그램
- **편의성**: 처방전 사진 한 장으로 자동 분석
- **접근성**: 24시간 AI 챗봇 상담

---

## 주요 기능

### 1. OCR 처방전 인식
- **Naver Clova OCR** 활용한 처방전 자동 인식
- 신뢰도 점수 표시 (0~100%)
- 지원 형식: JPEG, PNG (최대 10MB)

### 2. 약물 상호작용 분석
- **GPT-4** 기반 기존 약물 + 신규 약물 상호작용 분석
- 위험도별 경고 (High / Medium / Low)
- 상호작용 원리 및 권장사항 제공
- 자동 복약 시간표 생성 (아침/점심/저녁/취침 전)

### 3. 맞춤 재활 가이드
- 기저질환(당뇨/고혈압/골다공증)을 고려한 안전한 운동 추천
- 주차별 재활 프로그램 (1~4주)
- 운동별 세트/횟수, 난이도 표시
- 금기 운동 자동 제외

### 4. AI 챗봇
- 분석 결과 및 재활 플랜을 컨텍스트로 활용하는 대화형 챗봇
- 약물/재활 관련 질문 24시간 응답
- 의료 면책 문구 자동 포함
- 대화 이력 저장 및 세션 관리

### 5. 건강 프로필 관리
- 만성질환 등록 (당뇨, 고혈압, 골다공증)
- 복용 약물 관리 (약물명, 용량, 복용 시간)
- 알러지 정보 등록

---

## 기술 스택

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| **FastAPI** | 0.115.0 | 고성능 비동기 웹 프레임워크 |
| **SQLAlchemy** | 2.0.35 | ORM |
| **PostgreSQL** | 15+ | 메인 데이터베이스 |
| **Alembic** | 1.13.3 | 데이터베이스 마이그레이션 |
| **Pydantic** | 2.12.5 | 데이터 검증 및 직렬화 |
| **OpenAI API** | 1.51.0 | GPT-4 기반 AI 분석 |
| **Uvicorn** | 0.30.6 | ASGI 서버 |

### AI/ML
- **OpenAI GPT-4**: 약물 상호작용 분석, 재활 가이드 생성, 챗봇 응답
- **Naver Clova OCR**: 처방전 텍스트 인식

### Infrastructure
- **Docker & Docker Compose**: 컨테이너화 (PostgreSQL)
- **Python 3.13+**: 메인 언어
- **uv**: 패키지 관리

---

## 프로젝트 구조

```
AI_Health_final/
├── app/                          # 메인 애플리케이션
│   ├── core/                     # 핵심 설정
│   │   ├── config.py            # 환경 변수 설정
│   │   ├── database.py          # DB 연결 설정
│   │   └── security.py          # JWT 인증
│   ├── models/                   # SQLAlchemy 모델
│   │   ├── user.py              # 사용자, 프로필
│   │   ├── document.py          # 문서, OCR 결과
│   │   ├── analysis.py          # AI 분석 결과
│   │   ├── rehab.py             # 재활 운동
│   │   └── chat.py              # 챗봇 세션/메시지
│   ├── routers/                  # API 엔드포인트
│   │   ├── auth.py              # 인증 (회원가입/로그인)
│   │   ├── profile.py           # 프로필 관리
│   │   ├── documents.py         # 문서 업로드/OCR
│   │   ├── analysis.py          # AI 분석
│   │   ├── rehab.py             # 재활 운동
│   │   ├── chat.py              # 챗봇
│   │   └── feedback.py          # 피드백
│   ├── services/                 # 비즈니스 로직
│   │   ├── ocr_service.py       # OCR 처리
│   │   ├── analysis_service.py  # AI 분석 (비동기)
│   │   ├── rehab_service.py     # 재활 가이드 생성
│   │   ├── chat_service.py      # 챗봇 로직
│   │   └── profile_service.py   # 프로필 관리
│   └── main.py                   # FastAPI 앱 진입점
├── alembic/                      # 데이터베이스 마이그레이션
│   ├── versions/                 # 마이그레이션 파일
│   └── env.py                    # Alembic 설정
├── data/                         # Seed 데이터
│   ├── seed_exercises.sql       # 운동 라이브러리 (30개)
│   └── seed_knowledge.json      # AI 챗봇 지식 베이스 (60개)
├── docs/                         # 프로젝트 문서
│   ├── 00_unified_RDD.md        # 요구사항 정의서
│   ├── 01_Requirements.md       # 기능 명세
│   ├── 02_ERD_Explanation.md    # 데이터베이스 설계
│   ├── 03_API_Specification.md  # API 문서
│   └── ERD_Diagram.png          # ERD 다이어그램
├── scripts/                      # 유틸리티 스크립트
│   ├── seed_exercises.py        # 운동 데이터 로딩
│   └── seed_knowledge.py        # 지식 베이스 로딩
├── .env                          # 환경 변수 (git 제외)
├── docker-compose.yml            # Docker 설정
├── requirements.txt              # Python 의존성
├── alembic.ini                   # Alembic 설정
└── README.md
```

---

## 설치 및 실행

### 사전 요구사항

- Python 3.13+
- Docker & Docker Compose

### 1. 저장소 클론

```bash
git clone https://github.com/AI-HealthCare-01/AI_01_sollji.git
cd AI_01_sollji
```

### 2. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성:

```env
# Database
POSTGRES_USER=ai_health_user
POSTGRES_PASSWORD=ai_health_pass
POSTGRES_DB=ai_health_db
DATABASE_URL=postgresql+psycopg://ai_health_user:ai_health_pass@localhost:5432/ai_health_db

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Naver Clova OCR
NAVER_OCR_API_URL=https://...
NAVER_OCR_SECRET_KEY=...

# App
APP_ENV=development
DEBUG=true
```

### 3. Docker로 PostgreSQL 실행

```bash
docker-compose up -d
```

### 4. 가상환경 및 의존성 설치

```bash
# uv 사용 (권장)
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv pip install -r requirements.txt

# 또는 pip 사용
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 5. 데이터베이스 마이그레이션

```bash
alembic upgrade head
```

### 6. Seed 데이터 로딩

```bash
# 운동 라이브러리 (30개)
python scripts/seed_exercises.py

# AI 챗봇 지식 베이스 (60개)
python scripts/seed_knowledge.py
```

### 7. 서버 실행

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

실행 후:
- API 서버: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 8. 헬스 체크

```bash
curl http://localhost:8000/health
```

```json
{
  "status": "ok",
  "env": "development",
  "version": "0.1.0"
}
```

---

## API 엔드포인트

> Base URL: `http://localhost:8000/api/v1`
> 인증: `Authorization: Bearer {token}`

### 인증 (Authentication)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/v1/auth/register` | 회원가입 | ❌ |
| POST | `/api/v1/auth/login` | 로그인 (JWT 발급) | ❌ |
| GET | `/api/v1/auth/me` | 내 정보 조회 | ✅ |

### 프로필 (Profile)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/v1/profile/me` | 전체 프로필 조회 | ✅ |
| POST | `/api/v1/profile/health` | 건강 프로필 등록/수정 | ✅ |
| GET | `/api/v1/profile/conditions` | 만성질환 목록 조회 | ✅ |
| POST | `/api/v1/profile/conditions` | 만성질환 등록 | ✅ |
| DELETE | `/api/v1/profile/conditions/{id}` | 만성질환 삭제 | ✅ |
| GET | `/api/v1/profile/medications` | 복용 약물 목록 조회 | ✅ |
| POST | `/api/v1/profile/medications` | 복용 약물 등록 | ✅ |
| DELETE | `/api/v1/profile/medications/{id}` | 복용 약물 삭제 | ✅ |
| GET | `/api/v1/profile/allergies` | 알러지 목록 조회 | ✅ |
| POST | `/api/v1/profile/allergies` | 알러지 등록 | ✅ |
| DELETE | `/api/v1/profile/allergies/{id}` | 알러지 삭제 | ✅ |

### 문서 및 OCR (Documents)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/v1/documents/upload` | 처방전 업로드 + OCR 자동 실행 | ✅ |
| GET | `/api/v1/documents/{document_id}` | 문서 및 OCR 결과 조회 | ✅ |

### AI 분석 (Analysis)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/v1/analysis/{document_id}` | 처방전 AI 분석 요청 (비동기) | ✅ |
| GET | `/api/v1/analysis/{guide_result_id}/status` | 분석 진행 상태 조회 | ✅ |

### 재활 (Rehabilitation)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/v1/rehab/plans` | 재활 계획 목록 조회 | ✅ |
| GET | `/api/v1/rehab/plans/{plan_id}` | 재활 계획 상세 조회 | ✅ |
| POST | `/api/v1/rehab/plans/{plan_id}/exercises/{id}/complete` | 운동 완료 체크 | ✅ |
| GET | `/api/v1/rehab/plans/{plan_id}/progress` | 재활 진행률 조회 | ✅ |
| GET | `/api/v1/rehab/exercises` | 운동 라이브러리 조회 | ✅ |

### 챗봇 (Chat)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/v1/chat` | 메시지 전송 (세션 자동 생성) | ✅ |
| GET | `/api/v1/chat/sessions` | 채팅 세션 목록 조회 | ✅ |
| GET | `/api/v1/chat/sessions/{session_id}/messages` | 대화 이력 조회 | ✅ |
| PATCH | `/api/v1/chat/sessions/{session_id}/end` | 세션 종료 | ✅ |

### 피드백 (Feedback)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/v1/feedbacks` | 피드백 제출 | ✅ |
| GET | `/api/v1/feedbacks` | 피드백 목록 조회 | ✅ |

상세 요청/응답 스키마는 [API 명세서](./docs/03_API_Specification.md) 또는 `/docs` (Swagger UI)를 참고하세요.

---

## 데이터베이스 스키마

총 18개 테이블. ERD 다이어그램은 [여기](./docs/ERD_Diagram.png)를 참고하세요.

### 사용자 관련
- **users**: 사용자 기본 정보
- **health_profiles**: 건강 프로필 (키, 몸무게, 혈액형 등)
- **chronic_conditions**: 만성질환 정보
- **medications**: 복용 약물
- **allergies**: 알러지 정보

### 문서 및 분석
- **documents**: 업로드된 처방전
- **ocr_results**: OCR 인식 결과
- **guide_results**: AI 분석 결과
- **drug_interactions**: 약물 상호작용
- **medication_schedules**: 복약 시간표

### 재활
- **rehab_plans**: 재활 계획
- **rehab_exercises**: 재활 운동 (주차별)
- **exercise_library**: 운동 라이브러리 (30개 seed)
- **exercise_completions**: 운동 완료 기록

### 챗봇 및 기타
- **chat_sessions**: 챗봇 세션
- **chat_messages**: 챗봇 메시지
- **feedbacks**: 사용자 피드백
- **notifications**: 알림 (테이블 설계 완료, Phase 2 구현 예정)

상세 설명은 [ERD 문서](./docs/02_ERD_Explanation.md)를 참고하세요.

---

## 주요 사용 시나리오

### 시나리오 1: 김영희 (65세, 당뇨+골다공증)

1. 회원가입 후 기저질환 입력 (당뇨, 골다공증)
2. 기존 복용약 등록 (메트포르민, 알렌드로네이트)
3. 손목 골절 수술 후 처방전 업로드
4. AI 분석 결과 확인:
   - 약물 상호작용 경고 (트라마돌 + 메트포르민)
   - 복약 시간표 자동 생성
   - 손목 재활 운동 추천 (당뇨 환자 주의사항 포함)
5. 챗봇 질문: "진통제 먹으면 어지러운데 운동해도 되나요?"

### 시나리오 2: 박철수 (58세, 고혈압+고지혈증)

1. 로그인 후 신경차단술 처방전 업로드
2. AI 분석 결과:
   - 이부프로펜 + 암로디핀 상호작용 경고
   - 허리 재활 운동 프로그램 (고혈압 환자 안전 운동)
3. 챗봇 질문: "근이완제 먹으면 졸린데 운전해도 되나요?"

---

## 보안

- **JWT 기반 인증** (24시간 유효, bcrypt 비밀번호 암호화)
- **CORS 설정**: 허용된 도메인만 접근
- **파일 업로드 제한**: 10MB, JPEG/PNG만 허용
- **SQL Injection 방지**: SQLAlchemy ORM 사용
- **입력 검증**: Pydantic 스키마로 모든 입력 검증

---

## 개발 로드맵

### Phase 1 (완료) 
- 회원가입/로그인 (JWT 인증)
- OCR 처방전 인식
- 약물 상호작용 AI 분석 (비동기)
- 맞춤형 재활 가이드 생성
- AI 챗봇 (세션 관리 포함)
- 사용자 피드백

### Phase 2 (진행 중)
- 프론트엔드 (React 18 + TypeScript)
- 복약 리마인더 알림
- 운동 완료 통계 대시보드

### Phase 3 (장기)
- AWS S3 연동 (처방전 이미지 클라우드 저장)
- 의사용 요약 리포트
- 모바일 앱 (React Native)

---

## 문서

| 문서 | 설명 |
|------|------|
| [요구사항 정의서](./docs/00_unified_RDD.md) | 프로젝트 전체 요구사항 및 시스템 아키텍처 |
| [기능 명세](./docs/01_Requirements.md) | 상세 기능 설명 및 사용자 스토리 |
| [ERD 설명](./docs/02_ERD_Explanation.md) | 데이터베이스 설계 및 테이블 관계 |
| [API 명세](./docs/03_API_Specification.md) | API 엔드포인트 상세 문서 |

---

## 면책 조항

이 시스템은 의료 정보 제공 목적이며, 실제 의료 진단이나 처방을 대체할 수 없습니다.
모든 의료 결정은 반드시 의사와 상담하세요.

---

**프로젝트 기간**: 2026.02.19 ~ 2026.03.20
**배포 목표일**: 2026.03.13
```

---