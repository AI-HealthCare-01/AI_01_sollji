# ChronicCare Ortho 요구사항 정의서

**문서 버전:** v1.0

**작성일:** 2026-02-25

**프로젝트 기간:** 2026.02.19 ~ 2026.03.20

**배포 목표일:** 2026.03.13

**문서 목적:** 만성질환자 정형외과 통합 케어 시스템의 개발 범위, 기능 명세, 검수 기준을 정의한다.

**문서 변경 이력:**

- v1.0 (2026-02-25): 초기 작성 (기획 단계)

---

## 1. 프로젝트 개요

### 1.1 프로젝트명

**ChronicCare Ortho** (만성질환자 맞춤형 통합 복약·재활 관리 시스템)

### 1.2 배경 및 목적

**배경:**

- 만성질환(당뇨/고혈압/골다공증) 환자가 정형외과 치료를 받을 때, 기존 복용약과 신규 처방약의 상호작용 위험이 높다.
- 3분 진료 환경에서는 약물 상호작용, 기저질환 고려 재활 가이드를 충분히 제공하기 어렵다.
- 퇴원 후 ~ 재방문 사이(평균 2주) 환자는 불안과 위험에 노출된다.

**목적:**

- OCR 기반 자동 약물 분석으로 복약 관리 부담을 줄인다.
- 기저질환을 고려한 안전한 재활 운동 가이드를 제공한다.
- 24시간 챗봇으로 퇴원 후 관리 공백을 메운다.

### 1.3 범위 (Scope)

### 필수 기능 (Core - 16일 내 완성)

1. **사용자 프로필 관리** (기저질환, 기존 복용 약물 입력)
2. **OCR 기반 처방전 인식** (Naver Clova OCR)
3. **OCR 결과 수정 기능** (사용자 직접 수정)
4. **약물 상호작용 분석** (LLM 기반)
5. **복약 시간표 자동 생성**
6. **맞춤 재활 가이드 생성** (Seed Data 기반)
7. **RAG 챗봇** (약물/재활 질문 응답)

### 선택 기능 (Optional - 시간 여유 시)

1. 안전 점수 표시 (메인 화면)
2. 의사용 요약 리포트 (팝업)
3. 복약 리마인더 (알림)

### 제외 사항 (Out of Scope)

- 실제 의료 진단/처방 변경 기능
- 전자의무기록(EMR) 연동
- 결제/구독 시스템
- 웨어러블 기기 연동

### 기술 스택

- Frontend: React + TailwindCSS
- Backend: FastAPI + PostgreSQL
- AI: GPT-4 + LangChain + Clova OCR
- Infra: Docker

---

## 2. 행위 주체 (Actors)

| 행위자 | 역할 | 주요 행동 |
| --- | --- | --- |
| **사용자 (User)** | 만성질환을 가진 정형외과 환자 | - 회원가입/로그인<br>- 기저질환 입력<br>- 처방전 업로드<br>- OCR 결과 수정<br>- 분석 결과 확인<br>- 챗봇 질문 |
| **시스템 (System)** | API 서버 | - 인증/인가<br>- 데이터 저장/조회<br>- 외부 API 중계<br>- 에러 처리 |
| **AI 워커 (AI Worker)** | 비동기 분석 엔진 | - OCR 처리<br>- LLM 가이드 생성<br>- RAG 검색 |

---

## 3. 타겟 사용자 페르소나

### 페르소나 1: 김영희 (65세, 여성) - 수술 케이스

```
기저질환: 당뇨(5년) + 골다공증(3년)
복용약: 메트포르민, 알렌드로네이트, 칼슘/비타민D
상황: 손목 골절 수술 후 퇴원
신규 처방: 트라마돌(진통제), 세파클러(항생제), 란소프라졸(위장보호제)

니즈:
- 약이 7~8종류라 복용 시간 헷갈림
- 골다공증 약 복용법 복잡해서 불안
- 진통제 먹으면 어지러워서 낙상 위험 걱정
- 손목 언제부터 움직여도 되는지 모름
```

### 페르소나 2: 박철수 (58세, 남성) - 시술 케이스

```
기저질환: 고혈압(10년) + 고지혈증(3년)
복용약: 암로디핀, 아토르바스타틴
상황: 만성 요통으로 신경차단술 후 약물 치료
신규 처방: 이부프로펜(소염진통제), 에페리손(근이완제), 가바펜틴(신경통약)

니즈:
- 고혈압 약이랑 진통제 같이 먹어도 되나?
- 근이완제 먹으면 졸린데 운전해도 되나?
- 허리 운동 언제부터 시작하나?
- 혈압이 올라가는 것 같은데 약 때문인가?
```

### 페르소나 3: 이순자 (72세, 여성) - 일반 질환 케이스

```
기저질환: 당뇨(15년, 인슐린) + 고혈압(20년) + 골다공증(5년)
복용약: 인슐린, 텔미사르탄, 알렌드로네이트
상황: 무릎 관절염으로 스테로이드 주사
신규 처방: 트리암시놀론(관절 내 주사), 셀레콕시브(소염진통제)

니즈:
- 주사 맞으면 혈당 올라간다는데 얼마나?
- 인슐린 용량 조절해야 하나?
- 무릎 운동 언제부터 해도 되나?
- 골다공증 있는데 무릎 운동 해도 되나?
```

---

## 4. 시스템 상세 로직

### 4.1 전체 플로우

```
[사용자 온보딩]
1. 회원가입 (이메일, 비밀번호)
2. 기저질환 선택 (당뇨/고혈압/골다공증)
3. 현재 복용 약물 입력
4. 알러지 정보 입력 (선택)

         ↓

[처방전 분석]
5. 처방전 이미지 업로드
6. OCR 처리 (비동기)
7. OCR 결과 확인 및 수정 
8. 분석 시작 버튼 클릭

         ↓

[AI 분석]
9. 기존 약물 + 신규 약물 병합
10. 약물 상호작용 분석 (LLM)
11. 재활 가이드 생성 (LLM + Seed Data)
12. 결과 DB 저장

         ↓

[결과 확인]
13. 안전 점수 표시
14. 약물 상호작용 경고
15. 복약 시간표
16. 재활 운동 프로그램
17. 챗봇으로 추가 질문
```

---

### 4.2 핵심 로직 상세

### A. OCR 처리 로직

**입력:**

- 처방전 이미지 (JPEG/PNG, 최대 10MB)

**처리 단계:**

```
1. 이미지 업로드 → 임시 저장 (24시간 후 자동 삭제)
2. Naver Clova OCR API 호출
3. 응답 JSON 파싱:
   {
     "images": [{
       "fields": [
         {"inferText": "이부프로펜정 400mg", "inferConfidence": 0.92}
       ]
     }]
   }
4. 약품명, 용량, 복용법 추출 (정규식)
5. 신뢰도 점수 계산 (평균 confidence)
```

**출력:**

```json
{
  "ocr_result_id": 123,
  "confidence_score": 0.90,
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

**에러 처리:**

| 조건 | 처리 방법 | 사용자 메시지 |
| --- | --- | --- |
| 신뢰도 < 0.7 | 수정 요청 | "인식 정확도가 낮습니다. 확인해주세요" |
| OCR API 실패 | 3회 재시도 | "인식 실패. 직접 입력해주세요" |
| 이미지 용량 초과 | 업로드 거부 | "10MB 이하 이미지만 가능합니다" |

---

### B. 약물 상호작용 분석 로직

**입력:**

```json
{
  "user_id": 1,
  "chronic_medications": [
    {"name": "메트포르민", "dosage": "500mg"}
  ],
  "new_medications": [
    {"name": "이부프로펜", "dosage": "400mg"}
  ]
}
```

**LLM 프롬프트:**

```
System: 너는 약물 상호작용 전문가야.

User:
환자 정보:
- 기저질환: 당뇨(제2형)
- 기존 약: 메트포르민 500mg
- 신규 약: 이부프로펜 400mg

다음 형식으로 분석:
{
  "interactions": [
    {
      "drug_a": "약물A",
      "drug_b": "약물B",
      "severity": "high/medium/low",
      "mechanism": "상호작용 원리",
      "recommendation": "권장사항"
    }
  ],
  "schedules": [
    {
      "time": "아침 식후",
      "medications": ["약물A", "약물B"]
    }
  ]
}
```

**출력 (LLM 응답):**

```json
{
  "interactions": [
    {
      "drug_a": "메트포르민",
      "drug_b": "이부프로펜",
      "severity": "medium",
      "mechanism": "신장 기능 저하 위험",
      "recommendation": "복용 중 신장 기능 체크"
    }
  ],
  "schedules": [
    {
      "time": "아침 식후",
      "medications": ["메트포르민", "이부프로펜"],
      "instructions": "물 한 컵과 함께"
    }
  ]
}
```

**DB 저장:**

- `drug_interactions` 테이블에 저장
- `medication_schedules` 테이블에 저장

---

### C. 재활 가이드 생성 로직

**전제 조건:**

- `exercise_library` 테이블에 30개 운동 Seed Data 삽입 완료

**입력:**

```json
{
  "user_id": 1,
  "chronic_conditions": ["당뇨", "골다공증"],
  "target_area": "무릎",
  "surgery_date": "2026-02-01"
}
```

**LLM 프롬프트:**

```
System: 너는 물리치료사야.

User:
환자: 당뇨, 골다공증
수술 부위: 무릎
수술일: 2026-02-01 (2주 경과)

운동 라이브러리:
[
  {"id": "knee01", "name": "큐세팅", "난이도": "하", "태그": ["당뇨안전"]},
  {"id": "knee02", "name": "SLR", "난이도": "중", "금기": "급성통증"}
]

제약:
- 당뇨: 상처 회복 느림
- 골다공증: 낙상 위험 운동 제외

4주 재활 플랜:
{
  "plan": {"target_area": "무릎", "duration_weeks": 4},
  "exercises": [
    {"week": 1, "exercise_id": "knee01", "sets": 3, "reps": 10}
  ]
}
```

**출력:**

```json
{
  "plan": {
    "target_area": "무릎",
    "duration_weeks": 4,
    "goal": "무릎 가동범위 120도 회복"
  },
  "exercises": [
    {
      "week": 1,
      "exercise_id": "knee01",
      "sets": 3,
      "reps": 10,
      "notes": "당뇨 환자 상처 체크 후 시작"
    }
  ]
}
```

**DB 저장:**

1. `rehab_plans` 테이블에 플랜 저장
2. `rehab_exercises` 테이블에 주차별 운동 저장

**프론트엔드 표시:**

- 운동명: `exercise_library`에서 `exercise_id`로 조회
- 영상 링크: `exercise_library.video_url`
- 태그: [당뇨안전] [저강도] 배지 표시

---

### D. RAG 챗봇 로직

**전략:** 데이터 양이 적으므로(Text < 100KB), 벡터 DB 없이 프롬프트에 컨텍스트를 직접 주입하여 개발 속도와 정확도 확보.

**입력 (사용자 질문):**

```
"이부프로펜 먹으면 어지러운데 운동해도 되나요?"
```

**처리:**

```
1. 사용자의 분석 리포트 조회 (DB)
2. 운동 라이브러리 전체 조회 (DB)
3. 프롬프트에 컨텍스트 직접 주입
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
[운동 라이브러리]
{전체 운동 데이터 JSON}

User: 이부프로펜 먹으면 어지러운데 운동해도 되나요?
```

**출력:**

```
이부프로펜은 어지러움을 유발할 수 있습니다.
골다공증 환자분께서는 낙상 위험이 높으므로,
약 복용 후 30분간은 운동을 피하시고,
바닥에 앉아서 하는 운동(큐세팅)을 권장합니다.

⚠️ 정확한 진단은 의사와 상담하세요.
```

**기술적 제약사항:**
- OpenAI API 호출 시 `response_format={"type": "json_object"}` 필수
- JSON 파싱 실패 시 최대 3회 재시도
- 3회 실패 시 `LLM_002` 에러 반환


---

## 5. 기능적 요구사항

| ID | 구분 | 카테고리 | 요구사항 명칭 | 상세 내용 | 우선순위 | 검수 기준 |
| --- | --- | --- | --- | --- | --- | --- |
| **REQ-001** | 기능 | 인증 | 회원가입 | 이메일, 비밀번호로 회원가입 | High | 중복 이메일 체크 |
| **REQ-002** | 기능 | 인증 | 로그인 | 이메일+비밀번호 로그인 | High | JWT 토큰 발급 |
| **REQ-003** | 기능 | 프로필 | 기저질환 입력 | 당뇨/고혈압/골다공증 복수 선택 | High | 최소 1개 선택 |
| **REQ-004** | 기능 | 프로필 | 기존 약물 입력 | 약품명, 용량, 복용 시간 입력 | High | 약품명 자동완성 |
| **REQ-005** | 기능 | OCR | 처방전 업로드 | 카메라/갤러리 이미지 선택 | High | JPEG/PNG, 10MB 이하 |
| **REQ-006** | 기능 | OCR | **OCR 결과 수정** | 인식된 약품명/용량 수정 | **High** | 수정 후 "확인" 버튼 |
| **REQ-007** | 기능 | OCR | 신뢰도 표시 | OCR 신뢰도 점수 표시 | Medium | 색상 구분 (초록/노랑/빨강) |
| **REQ-008** | 기능 | 분석 | 약물 상호작용 체크 | 기존약+신규약 상호작용 분석 | **High** | High/Medium 구분 |
| **REQ-009** | 기능 | 분석 | 복약 시간표 생성 | 시간대별 약물 리스트 | High | 아침/점심/저녁/취침전 |
| **REQ-010** | 기능 | 재활 | 맞춤 운동 추천 | 기저질환 고려 운동 추천 | **High** | 금기 운동 제외 확인 |
| **REQ-011** | 기능 | 재활 | 주차별 플랜 | 1~4주차 운동 프로그램 | High | 난이도 점진적 증가 |
| **REQ-012** | 기능 | 재활 | 영상 링크 제공 | 각 운동마다 유튜브 링크 | High | 링크 클릭 시 새 탭 |
| **REQ-013** | 기능 | 챗봇 | 질문 응답 | 약물/재활 질문 답변 | High | 3초 이내 응답 |
| **REQ-014** | 기능 | 챗봇 | 면책 조항 | 모든 응답에 면책 문구 | **High** | "의사 상담" 문구 필수 |
| **REQ-015** | 기능 | UI | 안전 점수 표시 | 메인 화면 0~100 점수 | Medium | 점수+색상+이모지 |
| **REQ-016** | 기능 | UI | 로딩 상태 표시 | 분석 중 진행 상황 텍스트 | High | "약물 분석 중..." 표시 |
| **REQ-017** | 기능 | 이력 | 분석 이력 조회 | 날짜별 과거 분석 리포트 목록 제공 | Medium | 날짜 역순 정렬 |
| **REQ-018** | 기능 | 시스템 | Seed Data 로딩 | 서버 시작 시 운동/약물 데이터 자동 적재 | **High** | exercises.json 30개 로딩 |
| **REQ-019** | 기능 | AI 평가 | 피드백 및 로그 수집 | 챗봇 응답에 좋아요/싫어요 버튼, 응답 속도(Latency) DB 저장 | **High** | 모든 응답에 피드백 버튼 |


---

## 6. 비기능적 요구사항

| ID | 구분 | 요구사항 명칭 | 상세 내용 | 검수 기준 |
| --- | --- | --- | --- | --- |
| **NF-001** | 성능 | OCR 처리 속도 | 이미지 업로드 후 5초 이내 결과 | 평균 5초 이하 |
| **NF-002** | 성능 | 분석 완료 시간 | OCR 확정 후 15초 이내 최종 결과 | 평균 15초 이하 |
| **NF-003** | 성능 | 챗봇 응답 속도 | 질문 후 3초 이내 답변 시작 | 평균 3초 이하 |
| **NF-004** | UX | 로딩 피드백 | 5초 이상 작업은 진행 상태 표시 | 텍스트 또는 프로그레스 바 |
| **NF-005** | UX | 접근성 (폰트) | 기본 폰트 크기 16px 이상 | 모든 텍스트 16px 이상 |
| **NF-006** | UX | 접근성 (터치) | 버튼 최소 높이 44px | 모든 버튼 44px 이상 |
| **NF-007** | 보안 | 이미지 삭제 | 처방전 원본 24시간 후 자동 삭제 | S3 Lifecycle 정책 |
| **NF-008** | 보안 | 데이터 암호화 | 민감 정보 AES-256 암호화 | 약물명, 질환명 암호화 |
| **NF-009** | 가용성 | 에러 핸들링 | OCR 실패 시 재촬영 유도 | 에러 메시지 + 재시도 버튼 |
| **NF-010** | 가용성 | LLM 실패 대응 | LLM API 실패 시 3회 재시도 | 3회 실패 후 "분석 실패" |
| **NF-011** | 기술 | JSON 포맷 강제 | LLM 응답 시 JSON 형식 강제 | `response_format={"type": "json_object"}` 사용 |

---

## 7. 데이터베이스 스키마 요약

### 7.1 ERD 관계도

```
users (1) ─────┬──── (N) chronic_conditions
               ├──── (N) medications
               ├──── (N) allergies
               ├──── (N) documents
               ├──── (N) guide_results
               └──── (N) chat_sessions

documents (1) ──── (1) ocr_results

guide_results (1) ─┬─ (N) drug_interactions
                   ├─ (N) medication_schedules
                   └─ (1) rehab_plans

rehab_plans (1) ──── (N) rehab_exercises

rehab_exercises (N) ──── (1) exercise_library

chat_sessions (1) ──── (N) chat_messages
```

### 7.2 핵심 테이블 (16개)

**Tier 1 (필수 - 11개):**

1. `users` - 사용자
2. `health_profiles` - 건강 프로필
3. `chronic_conditions` - 만성질환
4. `medications` - 복용 약물
5. `allergies` - 알러지
6. `documents` - 업로드 문서
7. `ocr_results` - OCR 결과
8. `guide_results` - AI 분석 결과
9. `drug_interactions` - 약물 상호작용
10. `medication_schedules` - 복약 시간표
11. `exercise_library` - 운동 라이브러리 (Seed Data)

**Tier 2 (중요 - 4개):**
12. `rehab_plans` - 재활 계획
13. `rehab_exercises` - 재활 운동 처방
14. `chat_sessions` - 채팅 세션
15. `chat_messages` - 채팅 메시지

**Tier 3 (보너스 - 1개):**
16. `notifications` - 알림

---

## 8. 에러 처리 및 예외 상황

### 8.1 OCR 관련 에러

| 에러 코드 | 상황 | 처리 방법 | 사용자 메시지 |
| --- | --- | --- | --- |
| `OCR_001` | 이미지 용량 초과 (>10MB) | 업로드 거부 | "이미지 용량은 10MB 이하여야 합니다" |
| `OCR_002` | 지원하지 않는 파일 형식 | 업로드 거부 | "JPEG 또는 PNG 파일만 가능합니다" |
| `OCR_003` | OCR API 실패 (3회 재시도 후) | 수동 입력 모드 | "인식 실패. 직접 입력해주세요" |
| `OCR_004` | 신뢰도 < 0.7 | 수동 확인 요청 | "인식 정확도가 낮습니다. 확인해주세요" |

### 8.2 LLM 관련 에러

| 에러 코드 | 상황 | 처리 방법 | 사용자 메시지 |
| --- | --- | --- | --- |
| `LLM_001` | API 호출 실패 | 3회 재시도 | "분석 중 오류 발생. 다시 시도해주세요" |
| `LLM_002` | JSON 형식 오류 | 재요청 | "분석 결과 처리 중 오류 발생" |
| `LLM_003` | 타임아웃 (30초 초과) | 작업 취소 | "분석 시간 초과. 다시 시도해주세요" |

---

## 9. 검수 체크리스트

### 9.1 기능 검수

```
□ 회원가입 및 로그인 작동
□ 기저질환 선택 및 저장
□ 기존 약물 입력 및 조회
□ 처방전 이미지 업로드 성공
□ OCR 결과 정확도 90% 이상 (테스트 이미지 10장)
□ OCR 결과 수정 기능 작동
□ 약물 상호작용 분석 정확도 95% 이상 (테스트 20개)
□ 복약 시간표 자동 생성
□ 재활 운동 추천 (금기 운동 제외)
□ 주차별 운동 프로그램 생성
□ 운동 영상 링크 클릭 시 새 탭
□ 챗봇 질문 응답 정확도 90% 이상 (테스트 20개)
□ 모든 응답에 면책 문구 포함
```

### 9.2 성능 검수

```
□ OCR 처리 시간 5초 이내 (평균)
□ 분석 완료 시간 15초 이내 (평균)
□ 챗봇 응답 시간 3초 이내 (평균)
□ 페이지 로딩 시간 2초 이내
```

### 9.3 UI/UX 검수

```
□ 모든 텍스트 16px 이상
□ 모든 버튼 44px 이상 높이
□ 색상 대비 명확 (WCAG AA 기준)
□ 로딩 시 진행 상황 표시
□ 에러 메시지 명확하게 표시
□ 모바일 반응형 디자인
```

---

## 10. 개발 일정

| 기간 | 작업 내용 | 산출물 |
| --- | --- | --- |
| **Day 1-2** | DB 설계 + Seed Data | ERD, **exercises.json 작성 및 로딩 스크립트 구현** |
| **Day 3-5** | OCR + LLM 로직 | API 엔드포인트 5개, **비동기 처리 구현** |
| **Day 6-9** | Frontend 개발 | 핵심 화면 7개 |
| **Day 10-12** | 챗봇 + 완성도 | **Context Injection 챗봇 구현** |
| **Day 13-14** | 테스트 + 버그 수정 | 테스트 리포트, **P95 Latency 측정** |
| **Day 15-16** | 발표 준비 | PPT, 데모 영상 |

---

## 11. 성공 지표 (KPI)

### 11.1 개발 완성도
# ChronicCare Ortho 요구사항 정의서 (최종 완전판)

**문서 버전:** v2.0 (시스템 아키텍처 추가)

**작성일:** 2026-02-26

**프로젝트 기간:** 2026.02.19 ~ 2026.03.20

**배포 목표일:** 2026.03.13

**문서 목적:** 만성질환자 정형외과 통합 케어 시스템의 개발 범위, 기능 명세, 검수 기준을 정의한다.

**문서 변경 이력:**

- v1.0 (2026-02-25): 초기 작성 (기획 단계)
- v2.0 (2026-02-26): 시스템 아키텍처 섹션 추가, requirements.txt 추가, Docker Compose 수정

---

## 1. 프로젝트 개요

### 1.1 프로젝트명

**ChronicCare Ortho** (만성질환자 맞춤형 통합 복약·재활 관리 시스템)

### 1.2 배경 및 목적

**배경:**

- 만성질환(당뇨/고혈압/골다공증) 환자가 정형외과 치료를 받을 때, 기존 복용약과 신규 처방약의 상호작용 위험이 높다.
- 3분 진료 환경에서는 약물 상호작용, 기저질환 고려 재활 가이드를 충분히 제공하기 어렵다.
- 퇴원 후 ~ 재방문 사이(평균 2주) 환자는 불안과 위험에 노출된다.

**목적:**

- OCR 기반 자동 약물 분석으로 복약 관리 부담을 줄인다.
- 기저질환을 고려한 안전한 재활 운동 가이드를 제공한다.
- 24시간 챗봇으로 퇴원 후 관리 공백을 메운다.

### 1.3 범위 (Scope)

### 필수 기능 (Core - 16일 내 완성)

1. **사용자 프로필 관리** (기저질환, 기존 복용 약물 입력)
2. **OCR 기반 처방전 인식** (Naver Clova OCR)
3. **OCR 결과 수정 기능** (사용자 직접 수정)
4. **약물 상호작용 분석** (LLM 기반)
5. **복약 시간표 자동 생성**
6. **맞춤 재활 가이드 생성** (Seed Data 기반)
7. **RAG 챗봇** (약물/재활 질문 응답)

### 선택 기능 (Optional - 시간 여유 시)

1. 안전 점수 표시 (메인 화면)
2. 의사용 요약 리포트 (팝업)
3. 복약 리마인더 (알림)

### 제외 사항 (Out of Scope)

- 실제 의료 진단/처방 변경 기능
- 전자의무기록(EMR) 연동
- 결제/구독 시스템
- 웨어러블 기기 연동

### 기술 스택

- Frontend: React + TailwindCSS
- Backend: FastAPI + PostgreSQL
- AI: GPT-4 + LangChain + Clova OCR
- Infra: Docker

---

## 2. 행위 주체 (Actors)

| 행위자 | 역할 | 주요 행동 |
| --- | --- | --- |
| **사용자 (User)** | 만성질환을 가진 정형외과 환자 | - 회원가입/로그인<br>- 기저질환 입력<br>- 처방전 업로드<br>- OCR 결과 수정<br>- 분석 결과 확인<br>- 챗봇 질문 |
| **시스템 (System)** | API 서버 | - 인증/인가<br>- 데이터 저장/조회<br>- 외부 API 중계<br>- 에러 처리 |
| **AI 워커 (AI Worker)** | 비동기 분석 엔진 | - OCR 처리<br>- LLM 가이드 생성<br>- RAG 검색 |

---

## 3. 타겟 사용자 페르소나

### 페르소나 1: 김영희 (65세, 여성) - 수술 케이스

```
기저질환: 당뇨(5년) + 골다공증(3년)
복용약: 메트포르민, 알렌드로네이트, 칼슘/비타민D
상황: 손목 골절 수술 후 퇴원
신규 처방: 트라마돌(진통제), 세파클러(항생제), 란소프라졸(위장보호제)

니즈:
- 약이 7~8종류라 복용 시간 헷갈림
- 골다공증 약 복용법 복잡해서 불안
- 진통제 먹으면 어지러워서 낙상 위험 걱정
- 손목 언제부터 움직여도 되는지 모름
```

### 페르소나 2: 박철수 (58세, 남성) - 시술 케이스

```
기저질환: 고혈압(10년) + 고지혈증(3년)
복용약: 암로디핀, 아토르바스타틴
상황: 만성 요통으로 신경차단술 후 약물 치료
신규 처방: 이부프로펜(소염진통제), 에페리손(근이완제), 가바펜틴(신경통약)

니즈:
- 고혈압 약이랑 진통제 같이 먹어도 되나?
- 근이완제 먹으면 졸린데 운전해도 되나?
- 허리 운동 언제부터 시작하나?
- 혈압이 올라가는 것 같은데 약 때문인가?
```

### 페르소나 3: 이순자 (72세, 여성) - 일반 질환 케이스

```
기저질환: 당뇨(15년, 인슐린) + 고혈압(20년) + 골다공증(5년)
복용약: 인슐린, 텔미사르탄, 알렌드로네이트
상황: 무릎 관절염으로 스테로이드 주사
신규 처방: 트리암시놀론(관절 내 주사), 셀레콕시브(소염진통제)

니즈:
- 주사 맞으면 혈당 올라간다는데 얼마나?
- 인슐린 용량 조절해야 하나?
- 무릎 운동 언제부터 해도 되나?
- 골다공증 있는데 무릎 운동 해도 되나?
```

---

## 4. 시스템 아키텍처 (System Architecture)

### 4.1 전체 시스템 구조 (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                         사용자 (User)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 온보딩 화면   │  │ OCR 화면     │  │ 분석 결과    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 재활 플랜     │  │ 챗봇 화면    │  │ 대시보드     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS (REST API)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Layer (Routers)                                      │   │
│  │  /auth  /profile  /ocr  /analysis  /rehab  /chat         │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐   │
│  │  Service Layer                                            │   │
│  │  ocr_service  llm_service  rag_service  s3_service       │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐   │
│  │  Data Layer (SQLAlchemy Models)                          │   │
│  │  User  Medication  Document  GuideResult  RehabPlan      │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │    Redis     │  │   Celery     │
│   (Main DB)  │  │  (Cache +    │  │  (Async      │
│              │  │   Queue)     │  │   Tasks)     │
└──────────────┘  └──────────────┘  └──────────────┘

        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Naver OCR   │  │  OpenAI GPT  │  │  Pinecone    │
│   (한글 인식) │  │  (약물 분석)  │  │  (RAG 검색)  │
└──────────────┘  └──────────────┘  └──────────────┘

        │
        ▼
┌──────────────┐
│   AWS S3     │
│ (이미지 저장) │
└──────────────┘
```

---

### 4.2 데이터 플로우 (Data Flow)

#### 4.2.1 처방전 업로드 → 약물 분석 플로우

```
1. 사용자가 처방전 이미지 업로드
   │
   ▼
2. Frontend → POST /api/ocr/upload (이미지 파일)
   │
   ▼
3. Backend (ocr_service.py)
   ├─► AWS S3에 이미지 업로드 (24시간 후 자동 삭제)
   ├─► Naver Clova OCR API 호출
   └─► OCR 결과 파싱 (정규식)
   │
   ▼
4. DB 저장 (documents, ocr_results 테이블)
   │
   ▼
5. Frontend → OCR 결과 확인 화면 (사용자가 수정 가능)
   │
   ▼
6. 사용자가 "분석 시작" 버튼 클릭
   │
   ▼
7. Frontend → POST /api/analysis/generate
   │
   ▼
8. Backend → Celery 작업 시작 (비동기)
   ├─► 기존 약물 조회 (medications 테이블)
   ├─► 신규 약물 조회 (ocr_results 테이블)
   ├─► LLM 약물 표준화 (OpenAI GPT-4)
   ├─► LLM 상호작용 분석 (OpenAI GPT-4)
   ├─► LLM 재활 가이드 생성 (OpenAI GPT-4)
   └─► DB 저장 (guide_results, drug_interactions, rehab_plans 테이블)
   │
   ▼
9. Frontend → 3초마다 폴링 (GET /api/analysis/status/{task_id})
   │
   ▼
10. 분석 완료 시 → 결과 페이지로 이동
```

#### 4.2.2 챗봇 질문 → 답변 플로우

```
1. 사용자가 챗봇 화면에서 질문 입력
   │
   ▼
2. Frontend → POST /api/chat/sessions (컨텍스트 포함)
   │
   ▼
3. Backend → ChatSession 생성 (context_type, context_id 저장)
   │
   ▼
4. Frontend → POST /api/chat/sessions/{session_id}/messages
   │
   ▼
5. Backend (rag_service.py)
   ├─► 컨텍스트 로드 (현재 보고 있는 화면 정보)
   ├─► Pinecone 벡터 검색 (유사 문서 3개)
   ├─► 사용자 프로필 로드 (기저질환, 복용약)
   └─► OpenAI GPT-4 호출 (프롬프트 구성)
   │
   ▼
6. Backend → ChatMessage 저장 (role: assistant)
   │
   ▼
7. Frontend → 챗봇 응답 표시
```

---

### 4.3 컴포넌트 간 통신 (Component Communication)

#### 4.3.1 Frontend ↔ Backend

**프로토콜:** HTTPS (REST API)

**인증 방식:** JWT Bearer Token

**요청 예시:**
```typescript
// frontend/src/api/client.ts
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT 토큰 자동 추가
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

**응답 형식:** JSON

**에러 처리:**
```typescript
// 401 Unauthorized → 로그인 페이지로 리다이렉트
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 4.3.2 Backend ↔ PostgreSQL

**연결 방식:** SQLAlchemy ORM

**연결 풀 설정:**
```python
# app/core/database.py
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,          # 기본 연결 10개
    max_overflow=20,       # 최대 30개까지 확장
    pool_pre_ping=True,    # 연결 유효성 체크
    pool_recycle=3600,     # 1시간마다 연결 재생성
    echo=False             # SQL 로그 비활성화 (프로덕션)
)
```

**트랜잭션 관리:**
```python
# 자동 커밋/롤백
@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = User(email=request.email, ...)
        db.add(user)
        db.commit()  # 성공 시 커밋
        return {"user_id": user.id}
    except Exception as e:
        db.rollback()  # 실패 시 롤백
        raise HTTPException(status_code=500, detail=str(e))
```

#### 4.3.3 Backend ↔ Redis

**사용 목적:**
1. **Celery 작업 큐** (비동기 작업)
2. **캐싱** (자주 조회되는 데이터)

**연결 설정:**
```python
# app/core/cache.py
import redis

redis_client = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True
)

# 캐싱 예시
def get_user_profile(user_id: int):
    cache_key = f"user_profile:{user_id}"
    
    # 캐시 확인
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # DB 조회
    user = db.query(User).filter_by(id=user_id).first()
    
    # 캐시 저장 (1시간)
    redis_client.setex(cache_key, 3600, json.dumps(user.dict()))
    
    return user
```

#### 4.3.4 Backend ↔ External APIs

**Naver Clova OCR:**
```python
# services/ocr_service.py
import requests

def call_naver_ocr(image_url: str) -> dict:
    response = requests.post(
        settings.NAVER_OCR_API_URL,
        headers={
            "X-OCR-SECRET": settings.NAVER_OCR_SECRET,
            "Content-Type": "application/json"
        },
        json={"images": [{"url": image_url}]},
        timeout=30  # 30초 타임아웃
    )
    response.raise_for_status()
    return response.json()
```

**OpenAI GPT-4:**
```python
# services/llm_service.py
from openai import OpenAI

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def analyze_drug_interactions(prompt: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": "너는 임상 약사입니다."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        timeout=60  # 60초 타임아웃
    )
    return json.loads(response.choices[0].message.content)
```

**Pinecone (RAG):**
```python
# services/rag_service.py
from pinecone import Pinecone

pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX_NAME)

def search_similar_documents(query: str, top_k: int = 3) -> list:
    # 쿼리 임베딩
    embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    ).data[0].embedding
    
    # 벡터 검색
    results = index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True
    )
    
    return [match.metadata for match in results.matches]
```

---

### 4.4 배포 아키텍처 (Deployment Architecture)

#### 4.4.1 로컬 개발 환경 (Docker Compose)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: chroniccare
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7.2
    ports:
      - "6379:6379"

  # Backend (FastAPI)
  backend:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/chroniccare
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app

  # Celery Worker
  celery:
    build: ./backend
    command: celery -A app.tasks.celery_app worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/chroniccare
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    # 🚨 중요: 코드 수정 시 Celery도 반영되도록 볼륨 마운트 필수!
    volumes:
      - ./backend:/app

  # Frontend (React)
  frontend:
    build: ./frontend
    command: npm run dev -- --host
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    environment:
      - VITE_API_URL=http://localhost:8000/api

volumes:
  postgres_data:
```

**실행 명령어:**
```bash
# 전체 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# Celery 워커 재시작 (코드 수정 후)
docker-compose restart celery

# 서비스 중지
docker-compose down
```

#### 4.4.2 프로덕션 환경 (선택 사항)

**Frontend:** Vercel (무료)
- React 앱 자동 빌드 및 배포
- CDN 자동 설정
- HTTPS 자동 설정

**Backend:** Railway (무료 티어)
- PostgreSQL 호스팅
- Redis 호스팅
- FastAPI 앱 배포
- 환경 변수 관리

**배포 플로우:**
```
1. GitHub에 코드 푸시
   │
   ▼
2. Vercel이 자동으로 Frontend 빌드
   │
   ▼
3. Railway가 자동으로 Backend 배포
   │
   ▼
4. 환경 변수 설정 (Railway 대시보드)
   │
   ▼
5. 배포 완료 (URL 자동 생성)
```

---

### 4.5 보안 아키텍처 (Security Architecture)

#### 4.5.1 인증 플로우 (Authentication Flow)

```
1. 사용자 로그인 요청
   │
   ▼
2. Backend → 비밀번호 검증 (bcrypt)
   │
   ▼
3. JWT 토큰 생성 (payload: user_id, exp: 24시간)
   │
   ▼
4. Frontend → localStorage에 토큰 저장
   │
   ▼
5. 이후 모든 요청에 Authorization 헤더 추가
   │
   ▼
6. Backend → JWT 검증 (get_current_user 미들웨어)
   │
   ▼
7. 유효하면 요청 처리, 무효하면 401 반환
```

#### 4.5.2 데이터 보안

**민감 정보 암호화:**
- ✅ 비밀번호: bcrypt (rounds=12)
- ✅ API 키: 환경 변수 (.env, 절대 Git에 커밋 금지)
- ✅ JWT 시크릿: 환경 변수

**HTTPS 강제:**
```python
# app/main.py
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()

# 프로덕션에서만 HTTPS 강제
if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

**CORS 설정:**
```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

# 🚨 중요: 로컬 개발 시 localhost와 127.0.0.1 모두 허용
origins = [
    settings.FRONTEND_URL,      # 프로덕션 URL
    "http://localhost:3000",    # 로컬 React 개발 서버
    "http://127.0.0.1:3000",    # 로컬 React (IP 접속 시)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # 목록 사용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 4.6 성능 최적화 (Performance Optimization)

#### 4.6.1 데이터베이스 최적화

**인덱스 전략:**
```python
# 자주 조회되는 컬럼에 인덱스
Index('idx_medications_standardized_name', 'standardized_name')
Index('idx_rehab_plans_user_active', 'user_id', 'is_active')
Index('idx_chat_sessions_user_status', 'user_id', 'status')
```

**쿼리 최적화:**
```python
# ❌ N+1 문제 (나쁜 예)
users = db.query(User).all()
for user in users:
    print(user.medications)  # 각 사용자마다 쿼리 발생!

# ✅ Eager Loading (좋은 예)
from sqlalchemy.orm import joinedload

users = db.query(User).options(
    joinedload(User.medications),
    joinedload(User.chronic_conditions)
).all()
```

#### 4.6.2 캐싱 전략

**Redis 캐싱:**
```python
# 자주 조회되는 데이터 캐싱
@router.get("/exercises/{exercise_id}")
async def get_exercise(exercise_id: str):
    cache_key = f"exercise:{exercise_id}"
    
    # 캐시 확인
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # DB 조회
    exercise = db.query(ExerciseLibrary).filter_by(
        exercise_id=exercise_id
    ).first()
    
    # 캐시 저장 (1시간)
    redis_client.setex(cache_key, 3600, json.dumps(exercise.dict()))
    
    return exercise
```

#### 4.6.3 비동기 처리

**Celery 작업 분리:**
```python
# 시간이 오래 걸리는 작업은 Celery로 분리
@celery_app.task
def analyze_medications(user_id: int, ocr_result_id: int):
    # LLM 호출 (15초 소요)
    # 사용자는 기다리지 않고 다른 작업 가능
    pass
```

---

### 4.7 모니터링 및 로깅 (Monitoring & Logging)

#### 4.7.1 로깅 전략

```python
# app/core/logging.py
import logging

# 로거 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# 사용 예시
@router.post("/ocr/upload")
async def upload_prescription(file: UploadFile):
    logger.info(f"OCR 업로드 시작: {file.filename}")
    try:
        result = process_ocr(file)
        logger.info(f"OCR 성공: {result.id}")
        return result
    except Exception as e:
        logger.error(f"OCR 실패: {str(e)}", exc_info=True)
        raise
```

#### 4.7.2 에러 추적

**Sentry 연동 (선택 사항):**
```python
# app/main.py
import sentry_sdk

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    traces_sample_rate=1.0,
)
```

---

## 5. 시스템 상세 로직

### 5.1 전체 플로우

```
[사용자 온보딩]
1. 회원가입 (이메일, 비밀번호)
2. 기저질환 선택 (당뇨/고혈압/골다공증)
3. 현재 복용 약물 입력
4. 알러지 정보 입력 (선택)

         ↓

[처방전 분석]
5. 처방전 이미지 업로드
6. OCR 처리 (비동기)
7. OCR 결과 확인 및 수정 
8. 분석 시작 버튼 클릭

         ↓

[AI 분석]
9. 기존 약물 + 신규 약물 병합
10. 약물 상호작용 분석 (LLM)
11. 재활 가이드 생성 (LLM + Seed Data)
12. 결과 DB 저장

         ↓

[결과 확인]
13. 안전 점수 표시
14. 약물 상호작용 경고
15. 복약 시간표
16. 재활 운동 프로그램
17. 챗봇으로 추가 질문
```

---

### 5.2 핵심 로직 상세

### A. OCR 처리 로직

**입력:**

- 처방전 이미지 (JPEG/PNG, 최대 10MB)

**처리 단계:**

```
1. 이미지 업로드 → 임시 저장 (24시간 후 자동 삭제)
2. Naver Clova OCR API 호출
3. 응답 JSON 파싱:
   {
     "images": [{
       "fields": [
         {"inferText": "이부프로펜정 400mg", "inferConfidence": 0.92}
       ]
     }]
   }
4. 약품명, 용량, 복용법 추출 (정규식)
5. 신뢰도 점수 계산 (평균 confidence)
```

**출력:**

```json
{
  "ocr_result_id": 123,
  "confidence_score": 0.90,
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

**에러 처리:**

| 조건 | 처리 방법 | 사용자 메시지 |
| --- | --- | --- |
| 신뢰도 < 0.7 | 수정 요청 | "인식 정확도가 낮습니다. 확인해주세요" |
| OCR API 실패 | 3회 재시도 | "인식 실패. 직접 입력해주세요" |
| 이미지 용량 초과 | 업로드 거부 | "10MB 이하 이미지만 가능합니다" |

---

### B. 약물 상호작용 분석 로직

**입력:**

```json
{
  "user_id": 1,
  "chronic_medications": [
    {"name": "메트포르민", "dosage": "500mg"}
  ],
  "new_medications": [
    {"name": "이부프로펜", "dosage": "400mg"}
  ]
}
```

**LLM 프롬프트:**

```
System: 너는 약물 상호작용 전문가야.

User:
환자 정보:
- 기저질환: 당뇨(제2형)
- 기존 약: 메트포르민 500mg
- 신규 약: 이부프로펜 400mg

다음 형식으로 분석:
{
  "interactions": [
    {
      "drug_a": "약물A",
      "drug_b": "약물B",
      "severity": "high/medium/low",
      "mechanism": "상호작용 원리",
      "recommendation": "권장사항"
    }
  ],
  "schedules": [
    {
      "time": "아침 식후",
      "medications": ["약물A", "약물B"]
    }
  ]
}
```

**출력 (LLM 응답):**

```json
{
  "interactions": [
    {
      "drug_a": "메트포르민",
      "drug_b": "이부프로펜",
      "severity": "medium",
      "mechanism": "신장 기능 저하 위험",
      "recommendation": "복용 중 신장 기능 체크"
    }
  ],
  "schedules": [
    {
      "time": "아침 식후",
      "medications": ["메트포르민", "이부프로펜"],
      "instructions": "물 한 컵과 함께"
    }
  ]
}
```

**DB 저장:**

- `drug_interactions` 테이블에 저장
- `medication_schedules` 테이블에 저장

---

### C. 재활 가이드 생성 로직

**전제 조건:**

- `exercise_library` 테이블에 30개 운동 Seed Data 삽입 완료

**입력:**

```json
{
  "user_id": 1,
  "chronic_conditions": ["당뇨", "골다공증"],
  "target_area": "무릎",
  "surgery_date": "2026-02-01"
}
```

**LLM 프롬프트:**

```
System: 너는 물리치료사야.

User:
환자: 당뇨, 골다공증
수술 부위: 무릎
수술일: 2026-02-01 (2주 경과)

운동 라이브러리:
[
  {"id": "knee01", "name": "큐세팅", "난이도": "하", "태그": ["당뇨안전"]},
  {"id": "knee02", "name": "SLR", "난이도": "중", "금기": "급성통증"}
]

제약:
- 당뇨: 상처 회복 느림
- 골다공증: 낙상 위험 운동 제외

4주 재활 플랜:
{
  "plan": {"target_area": "무릎", "duration_weeks": 4},
  "exercises": [
    {"week": 1, "exercise_id": "knee01", "sets": 3, "reps": 10}
  ]
}
```

**출력:**

```json
{
  "plan": {
    "target_area": "무릎",
    "duration_weeks": 4,
    "goal": "무릎 가동범위 120도 회복"
  },
  "exercises": [
    {
      "week": 1,
      "exercise_id": "knee01",
      "sets": 3,
      "reps": 10,
      "notes": "당뇨 환자 상처 체크 후 시작"
    }
  ]
}
```

**DB 저장:**

1. `rehab_plans` 테이블에 플랜 저장
2. `rehab_exercises` 테이블에 주차별 운동 저장

**프론트엔드 표시:**

- 운동명: `exercise_library`에서 `exercise_id`로 조회
- 영상 링크: `exercise_library.video_url`
- 태그: [당뇨안전] [저강도] 배지 표시

---

### D. RAG 챗봇 로직

**전략:** 데이터 양이 적으므로(Text < 100KB), 벡터 DB 없이 프롬프트에 컨텍스트를 직접 주입하여 개발 속도와 정확도 확보.

**입력 (사용자 질문):**

```
"이부프로펜 먹으면 어지러운데 운동해도 되나요?"
```

**처리:**

```
1. 사용자의 분석 리포트 조회 (DB)
2. 운동 라이브러리 전체 조회 (DB)
3. 프롬프트에 컨텍스트 직접 주입
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

[운동 라이브러리]
{전체 운동 데이터 JSON}

User: 이부프로펜 먹으면 어지러운데 운동해도 되나요?
```

**출력:**

```
이부프로펜은 어지러움을 유발할 수 있습니다.
골다공증 환자분께서는 낙상 위험이 높으므로,
약 복용 후 30분간은 운동을 피하시고,
바닥에 앉아서 하는 운동(큐세팅)을 권장합니다.

⚠️ 정확한 진단은 의사와 상담하세요.
```

**기술적 제약사항:**
- OpenAI API 호출 시 `response_format={"type": "json_object"}` 필수
- JSON 파싱 실패 시 최대 3회 재시도
- 3회 실패 시 `LLM_002` 에러 반환

---

## 6. 기능적 요구사항

| ID | 구분 | 카테고리 | 요구사항 명칭 | 상세 내용 | 우선순위 | 검수 기준 |
| --- | --- | --- | --- | --- | --- | --- |
| **REQ-001** | 기능 | 인증 | 회원가입 | 이메일, 비밀번호로 회원가입 | High | 중복 이메일 체크 |
| **REQ-002** | 기능 | 인증 | 로그인 | 이메일+비밀번호 로그인 | High | JWT 토큰 발급 |
| **REQ-003** | 기능 | 프로필 | 기저질환 입력 | 당뇨/고혈압/골다공증 복수 선택 | High | 최소 1개 선택 |
| **REQ-004** | 기능 | 프로필 | 기존 약물 입력 | 약품명, 용량, 복용 시간 입력 | High | 약품명 자동완성 |
| **REQ-005** | 기능 | OCR | 처방전 업로드 | 카메라/갤러리 이미지 선택 | High | JPEG/PNG, 10MB 이하 |
| **REQ-006** | 기능 | OCR | **OCR 결과 수정** | 인식된 약품명/용량 수정 | **High** | 수정 후 "확인" 버튼 |
| **REQ-007** | 기능 | OCR | 신뢰도 표시 | OCR 신뢰도 점수 표시 | Medium | 색상 구분 (초록/노랑/빨강) |
| **REQ-008** | 기능 | 분석 | 약물 상호작용 체크 | 기존약+신규약 상호작용 분석 | **High** | High/Medium 구분 |
| **REQ-009** | 기능 | 분석 | 복약 시간표 생성 | 시간대별 약물 리스트 | High | 아침/점심/저녁/취침전 |
| **REQ-010** | 기능 | 재활 | 맞춤 운동 추천 | 기저질환 고려 운동 추천 | **High** | 금기 운동 제외 확인 |
| **REQ-011** | 기능 | 재활 | 주차별 플랜 | 1~4주차 운동 프로그램 | High | 난이도 점진적 증가 |
| **REQ-012** | 기능 | 재활 | 영상 링크 제공 | 각 운동마다 유튜브 링크 | High | 링크 클릭 시 새 탭 |
| **REQ-013** | 기능 | 챗봇 | 질문 응답 | 약물/재활 질문 답변 | High | 3초 이내 응답 |
| **REQ-014** | 기능 | 챗봇 | 면책 조항 | 모든 응답에 면책 문구 | **High** | "의사 상담" 문구 필수 |
| **REQ-015** | 기능 | UI | 안전 점수 표시 | 메인 화면 0~100 점수 | Medium | 점수+색상+이모지 |
| **REQ-016** | 기능 | UI | 로딩 상태 표시 | 분석 중 진행 상황 텍스트 | High | "약물 분석 중..." 표시 |
| **REQ-017** | 기능 | 이력 | 분석 이력 조회 | 날짜별 과거 분석 리포트 목록 제공 | Medium | 날짜 역순 정렬 |
| **REQ-018** | 기능 | 시스템 | Seed Data 로딩 | 서버 시작 시 운동/약물 데이터 자동 적재 | **High** | exercises.json 30개 로딩 |
| **REQ-019** | 기능 | AI 평가 | 피드백 및 로그 수집 | 챗봇 응답에 좋아요/싫어요 버튼, 응답 속도(Latency) DB 저장 | **High** | 모든 응답에 피드백 버튼 |

---

## 7. 비기능적 요구사항

| ID | 구분 | 요구사항 명칭 | 상세 내용 | 검수 기준 |
| --- | --- | --- | --- | --- |
| **NF-001** | 성능 | OCR 처리 속도 | 이미지 업로드 후 5초 이내 결과 | 평균 5초 이하 |
| **NF-002** | 성능 | 분석 완료 시간 | OCR 확정 후 15초 이내 최종 결과 | 평균 15초 이하 |
| **NF-003** | 성능 | 챗봇 응답 속도 | 질문 후 3초 이내 답변 시작 | 평균 3초 이하 |
| **NF-004** | UX | 로딩 피드백 | 5초 이상 작업은 진행 상태 표시 | 텍스트 또는 프로그레스 바 |
| **NF-005** | UX | 접근성 (폰트) | 기본 폰트 크기 16px 이상 | 모든 텍스트 16px 이상 |
| **NF-006** | UX | 접근성 (터치) | 버튼 최소 높이 44px | 모든 버튼 44px 이상 |
| **NF-007** | 보안 | 이미지 삭제 | 처방전 원본 24시간 후 자동 삭제 | S3 Lifecycle 정책 |
| **NF-008** | 보안 | 데이터 암호화 | 민감 정보 AES-256 암호화 | 약물명, 질환명 암호화 |
| **NF-009** | 가용성 | 에러 핸들링 | OCR 실패 시 재촬영 유도 | 에러 메시지 + 재시도 버튼 |
| **NF-010** | 가용성 | LLM 실패 대응 | LLM API 실패 시 3회 재시도 | 3회 실패 후 "분석 실패" |
| **NF-011** | 기술 | JSON 포맷 강제 | LLM 응답 시 JSON 형식 강제 | `response_format={"type": "json_object"}` 사용 |

---

## 8. 데이터베이스 스키마 요약

### 8.1 ERD 관계도

```
users (1) ─────┬──── (N) chronic_conditions
               ├──── (N) medications
               ├──── (N) allergies
               ├──── (N) documents
               ├──── (N) guide_results
               └──── (N) chat_sessions

documents (1) ──── (1) ocr_results

guide_results (1) ─┬─ (N) drug_interactions
                   ├─ (N) medication_schedules
                   └─ (1) rehab_plans

rehab_plans (1) ──── (N) rehab_exercises

rehab_exercises (N) ──── (1) exercise_library

chat_sessions (1) ──── (N) chat_messages
```

### 8.2 핵심 테이블 (16개)

**Tier 1 (필수 - 11개):**

1. `users` - 사용자
2. `health_profiles` - 건강 프로필
3. `chronic_conditions` - 만성질환
4. `medications` - 복용 약물
5. `allergies` - 알러지
6. `documents` - 업로드 문서
7. `ocr_results` - OCR 결과
8. `guide_results` - AI 분석 결과
9. `drug_interactions` - 약물 상호작용
10. `medication_schedules` - 복약 시간표
11. `exercise_library` - 운동 라이브러리 (Seed Data)

**Tier 2 (중요 - 4개):**
12. `rehab_plans` - 재활 계획
13. `rehab_exercises` - 재활 운동 처방
14. `chat_sessions` - 채팅 세션
15. `chat_messages` - 채팅 메시지

**Tier 3 (보너스 - 1개):**
16. `notifications` - 알림

---

## 9. 에러 처리 및 예외 상황

### 9.1 OCR 관련 에러

| 에러 코드 | 상황 | 처리 방법 | 사용자 메시지 |
| --- | --- | --- | --- |
| `OCR_001` | 이미지 용량 초과 (>10MB) | 업로드 거부 | "이미지 용량은 10MB 이하여야 합니다" |
| `OCR_002` | 지원하지 않는 파일 형식 | 업로드 거부 | "JPEG 또는 PNG 파일만 가능합니다" |
| `OCR_003` | OCR API 실패 (3회 재시도 후) | 수동 입력 모드 | "인식 실패. 직접 입력해주세요" |
| `OCR_004` | 신뢰도 < 0.7 | 수동 확인 요청 | "인식 정확도가 낮습니다. 확인해주세요" |

### 9.2 LLM 관련 에러

| 에러 코드 | 상황 | 처리 방법 | 사용자 메시지 |
| --- | --- | --- | --- |
| `LLM_001` | API 호출 실패 | 3회 재시도 | "분석 중 오류 발생. 다시 시도해주세요" |
| `LLM_002` | JSON 형식 오류 | 재요청 | "분석 결과 처리 중 오류 발생" |
| `LLM_003` | 타임아웃 (30초 초과) | 작업 취소 | "분석 시간 초과. 다시 시도해주세요" |

---

## 10. 검수 체크리스트

### 10.1 기능 검수

```
□ 회원가입 및 로그인 작동
□ 기저질환 선택 및 저장
□ 기존 약물 입력 및 조회
□ 처방전 이미지 업로드 성공
□ OCR 결과 정확도 90% 이상 (테스트 이미지 10장)
□ OCR 결과 수정 기능 작동
□ 약물 상호작용 분석 정확도 95% 이상 (테스트 20개)
□ 복약 시간표 자동 생성
□ 재활 운동 추천 (금기 운동 제외)
□ 주차별 운동 프로그램 생성
□ 운동 영상 링크 클릭 시 새 탭
□ 챗봇 질문 응답 정확도 90% 이상 (테스트 20개)
□ 모든 응답에 면책 문구 포함
```

### 10.2 성능 검수

```
□ OCR 처리 시간 5초 이내 (평균)
□ 분석 완료 시간 15초 이내 (평균)
□ 챗봇 응답 시간 3초 이내 (평균)
□ 페이지 로딩 시간 2초 이내
```

### 10.3 UI/UX 검수

```
□ 모든 텍스트 16px 이상
□ 모든 버튼 44px 이상 높이
□ 색상 대비 명확 (WCAG AA 기준)
□ 로딩 시 진행 상황 표시
□ 에러 메시지 명확하게 표시
□ 모바일 반응형 디자인
```

---

## 11. 개발 일정

| 기간 | 작업 내용 | 산출물 |
| --- | --- | --- |
| **Day 1-2** | DB 설계 + Seed Data | ERD, **exercises.json 작성 및 로딩 스크립트 구현** |
| **Day 3-5** | OCR + LLM 로직 | API 엔드포인트 5개, **비동기 처리 구현** |
| **Day 6-9** | Frontend 개발 | 핵심 화면 7개 |
| **Day 10-12** | 챗봇 + 완성도 | **Context Injection 챗봇 구현** |
| **Day 13-14** | 테스트 + 버그 수정 | 테스트 리포트, **P95 Latency 측정** |
| **Day 15-16** | 발표 준비 | PPT, 데모 영상 |

---

## 12. 성공 지표 (KPI)

### 12.1 개발 완성도

```
□ 핵심 기능 100% 구현 (REQ-001 ~ REQ-014)
□ 페르소나 3명 시나리오 완벽 작동
□ 버그 0개 (Critical/High 우선순위)
```

### 12.2 사용자 가치

```
□ OCR 정확도 90% 이상
□ 약물 상호작용 정확도 95% 이상
□ 재활 운동 적합도 100% (금기 운동 0개)
□ 챗봇 응답 정확도 90% 이상
```

---

## 13. 기술 스택 상세 (requirements.txt)

### 13.1 Backend (Python 3.11+)

```txt
# requirements.txt

# FastAPI 프레임워크
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-multipart>=0.0.6

# 데이터베이스
sqlalchemy>=2.0.25
alembic>=1.13.1
psycopg2-binary>=2.9.9
asyncpg>=0.29.0

# 인증
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-dotenv>=1.0.0
pydantic-settings>=2.1.0

# AI/ML
openai>=1.10.0
langchain>=0.1.0
langchain-openai>=0.0.2
pinecone-client>=3.0.0

# 비동기 작업
celery>=5.3.4
redis>=5.0.1

# 이미지 처리
pillow>=10.2.0
boto3>=1.34.34  # AWS S3

# HTTP 클라이언트
requests>=2.31.0
httpx>=0.26.0

# 유틸리티
pydantic>=2.5.3
python-dateutil>=2.8.2
pytz>=2023.3
```

### 13.2 Frontend (Node.js 18+)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.5",
    "zustand": "^4.4.7",
    "tailwindcss": "^3.4.1",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-toast": "^1.1.5",
    "lucide-react": "^0.309.0",
    "date-fns": "^3.0.6"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
```

---

## 14. 환경 변수 예시 (.env)

```bash
# .env (절대 Git에 커밋하지 말 것!)

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chroniccare

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Naver Clova OCR
NAVER_OCR_API_URL=https://naveropenapi.apigw.ntruss.com/vision/v1/ocr
NAVER_OCR_SECRET=your-naver-ocr-secret-key

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=chroniccare-rag

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=chroniccare-prescriptions
AWS_REGION=ap-northeast-2

# Frontend URL (CORS)
FRONTEND_URL=https://your-frontend-domain.com

# Environment
ENVIRONMENT=development  # development | production

# Sentry (선택 사항)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

## 15. 첨부 자료

### 15.1 필수 준비 파일

```
1. ERD 다이어그램 (dbdiagram.io)
2. seeds/exercises.json (30개 운동 데이터)
3. seeds/drug_interactions.json (30개 약물 상호작용)
4. seeds/seed_loader.py (자동 로딩 스크립트)
5. 페르소나 상세 시나리오 (3개)
6. 프롬프트 템플릿 (복약 + 재활 + 챗봇)
7. API 명세서 (Swagger)
8. 데모 시나리오 스크립트
9. 발표 PPT 템플릿
```

---

## 16. 외부 API 사용 계획 (조교님 보고용)

### 16.1 사용할 외부 API 목록

| API | 용도 | 비용 | 월 예상 사용량 | 승인 필요 여부 |
|-----|------|------|---------------|--------------|
| **Naver Clova OCR** | 처방전 이미지 인식 | 월 1,000건 무료 | 200건 | ✅ API 키 필요 |
| **OpenAI GPT-4 Turbo** | 약물 분석, 재활 가이드, 챗봇 | 유료 ($0.01/1K tokens) | $5~10 | ✅ API 키 필요 |
| **Pinecone** | RAG 벡터 검색 | 무료 티어 (1M vectors) | 10K vectors | ✅ API 키 필요 |
| **AWS S3** | 처방전 이미지 저장 | 무료 티어 (5GB) | 1GB | ✅ AWS 계정 필요 |

### 16.2 API 키 발급 상태

```
□ Naver Clova OCR - 발급 필요 (https://www.ncloud.com/product/aiService/ocr)
□ OpenAI API - 발급 필요 (https://platform.openai.com/api-keys)
□ Pinecone - 발급 필요 (https://www.pinecone.io/)
□ AWS S3 - 발급 필요 (https://aws.amazon.com/s3/)
```

### 16.3 예상 비용 (16일 개발 기간)

| 항목 | 예상 비용 | 비고 |
|------|----------|------|
| OpenAI GPT-4 | $10 | 테스트 + 데모용 |
| Naver OCR | 무료 | 월 1,000건 무료 |
| Pinecone | 무료 | 무료 티어 |
| AWS S3 | 무료 | 무료 티어 |
| **총계** | **$10** | 개발 기간 총 비용 |

---

## 17. MVP 범위 정의 (조교님 보고용)

### 17.1 Phase 1 (필수, Day 1-9): 데모 가능한 최소 기능

**목표:** "처방전 업로드 → 약물 분석 결과 확인" 플로우 완성

```
✅ 회원가입/로그인 (JWT)
✅ 기저질환 입력 (당뇨/고혈압/골다공증)
✅ 기존 약물 입력
✅ 처방전 업로드 (OCR)
✅ OCR 결과 수정 화면
✅ 약물 상호작용 분석 결과 화면
✅ 복약 시간표 화면
✅ 재활 운동 추천 화면
```

**검수 기준:**
- 페르소나 1명(김영희) 시나리오 완벽 작동
- OCR 정확도 80% 이상
- 분석 완료 시간 20초 이내

---

### 17.2 Phase 2 (중요, Day 10-12): 차별화 기능

**목표:** 챗봇 추가로 사용자 경험 향상

```
✅ 챗봇 세션 생성
✅ 컨텍스트 인식 (사용자가 보는 화면 기반 답변)
✅ RAG 검색 (Pinecone)
✅ 면책 문구 자동 추가
```

**검수 기준:**
- 챗봇 응답 정확도 85% 이상
- 응답 시간 5초 이내

---

### 17.3 Phase 3 (선택, Day 13-14): 완성도 향상

**목표:** 시간 여유 시 추가 기능

```
⚪ 피드백 시스템 (좋아요/싫어요)
⚪ 운동 완료 기록
⚪ 안전 점수 표시
⚪ UI 개선 (애니메이션, 로딩 상태)
```

**검수 기준:**
- Phase 1, 2가 완벽히 작동하면 추가
- Phase 1, 2에 버그가 있으면 Phase 3 포기

---

## 18. 기술 난이도 평가 (조교님 보고용)

### 18.1 경험 있는 기술 (빠르게 개발 가능)

| 기술 | 경험 수준 | 예상 소요 시간 |
|------|----------|--------------|
| FastAPI | ⭐⭐⭐⭐ (프로젝트 2회) | 2일 |
| PostgreSQL | ⭐⭐⭐⭐ (SQL 쿼리 작성 가능) | 1일 |
| React + TypeScript | ⭐⭐⭐⭐ (프로젝트 3회) | 4일 |
| JWT 인증 | ⭐⭐⭐ (구현 경험 1회) | 1일 |

---

### 18.2 처음 사용하는 기술 (러닝 커브 필요)

| 기술 | 학습 계획 | 예상 소요 시간 | 대안 |
|------|----------|--------------|------|
| **Celery** | 공식 문서 + 튜토리얼 | 1일 | FastAPI BackgroundTasks |
| **Pinecone** | 퀵스타트 가이드 | 0.5일 | 프롬프트 직접 주입 (현재 전략) |
| **LangChain** | 예제 코드 참고 | 1일 | OpenAI API 직접 호출 |
| **Naver OCR** | API 문서 | 0.5일 | Google Vision API |

---

### 18.3 확인 필요한 사항

```
❓ Naver Clova OCR - 부트캠프에서 API 키 지원 가능한가요?
❓ OpenAI API - 부트캠프 계정 사용 가능한가요? (비용 $10)
❓ AWS S3 - 부트캠프 계정 사용 가능한가요?
❓ Pinecone - 개인 계정 사용해도 되나요? (무료 티어)
```

---

## 19. 리스크 관리 계획

### 19.1 기술적 리스크

| 리스크 | 발생 확률 | 영향도 | 대응 방안 |
|--------|----------|--------|----------|
| **OCR 정확도 낮음** | 중 | 높음 | 수동 수정 기능 강화 |
| **LLM 응답 불안정** | 중 | 높음 | 3회 재시도 + 에러 처리 |
| **Celery 설정 실패** | 중 | 중 | FastAPI BackgroundTasks로 대체 |
| **Pinecone 연동 실패** | 낮 | 낮 | 프롬프트 직접 주입으로 대체 |
| **AWS S3 비용 초과** | 낮 | 중 | 로컬 파일 시스템으로 대체 |

---

### 19.2 일정 리스크

| 리스크 | 발생 확률 | 영향도 | 대응 방안 |
|--------|----------|--------|----------|
| **Day 1-9 지연** | 중 | 높음 | Phase 3 포기 |
| **Day 10-12 지연** | 중 | 중 | 챗봇 간소화 (RAG 제외) |
| **버그 수정 시간 부족** | 높음 | 높음 | Day 13-14를 버그 수정에 집중 |

---

## 20. 데모 시나리오 (발표용)

### 20.1 시나리오 1: 김영희 (수술 케이스)

```
[1분] 온보딩
- 회원가입 (이메일: younghee@example.com)
- 기저질환 선택: 당뇨, 골다공증
- 기존 약물 입력: 메트포르민, 알렌드로네이트

[2분] 처방전 분석
- 처방전 이미지 업로드 (손목 골절 수술 후)
- OCR 결과 확인: 트라마돌, 세파클러, 란소프라졸
- "분석 시작" 버튼 클릭

[2분] 결과 확인
- 약물 상호작용 경고: "트라마돌 + 메트포르민 → 저혈당 위험"
- 복약 시간표: 아침 식후 (메트포르민, 세파클러), 저녁 식후 (트라마돌)
- 재활 운동: 손목 ROM 운동 (1주차), 당뇨 환자 주의사항

[1분] 챗봇 질문
- "트라마돌 먹으면 어지러운데 운동해도 되나요?"
- 챗봇 답변: "약 복용 후 30분간 운동 피하고, 바닥에 앉아서 하는 운동 권장"
```

**총 소요 시간:** 6분

---

### 20.2 시나리오 2: 박철수 (시술 케이스)

```
[1분] 온보딩
- 로그인 (이미 가입된 계정)
- 기저질환: 고혈압, 고지혈증
- 기존 약물: 암로디핀, 아토르바스타틴

[2분] 처방전 분석
- 처방전 이미지 업로드 (신경차단술 후)
- OCR 결과 확인: 이부프로펜, 에페리손, 가바펜틴
- "분석 시작" 버튼 클릭

[2분] 결과 확인
- 약물 상호작용 경고: "이부프로펜 + 암로디핀 → 혈압 상승 위험"
- 복약 시간표: 아침 식후 (암로디핀, 이부프로펜), 저녁 식후 (가바펜틴)
- 재활 운동: 허리 스트레칭 (1주차), 고혈압 환자 주의사항

[1분] 챗봇 질문
- "근이완제 먹으면 졸린데 운전해도 되나요?"
- 챗봇 답변: "에페리손은 졸음 유발 가능. 복용 후 4시간 운전 금지"
```

**총 소요 시간:** 6분

---

## 21. 발표 PPT 구성안

### 슬라이드 1: 표지
```
ChronicCare Ortho
만성질환자 맞춤형 통합 복약·재활 관리 시스템

팀명: [팀명]
팀원: [이름1, 이름2, ...]
```

### 슬라이드 2: 문제 정의
```
❌ 현재 문제점
- 만성질환 환자 + 정형외과 치료 = 약물 상호작용 위험 ↑
- 3분 진료로는 충분한 설명 불가
- 퇴원 후 2주간 관리 공백

📊 통계
- 만성질환 환자 65세 이상 80%
- 약물 상호작용 사고 연 1만 건
```

### 슬라이드 3: 솔루션
```
✅ ChronicCare Ortho의 해결책
1. OCR 기반 자동 약물 분석
2. 기저질환 고려 재활 가이드
3. 24시간 챗봇 상담
```

### 슬라이드 4: 핵심 기능
```
🔍 OCR 처방전 인식 (Naver Clova)
💊 약물 상호작용 분석 (GPT-4)
🏃 맞춤 재활 운동 추천
💬 RAG 챗봇 (컨텍스트 인식)
```

### 슬라이드 5: 기술 스택
```
Frontend: React + TypeScript
Backend: FastAPI + PostgreSQL
AI: GPT-4 + LangChain + Pinecone
Infra: Docker
```

### 슬라이드 6: 시스템 아키텍처
```
[4.1의 다이어그램 삽입]
```

### 슬라이드 7: 데모 (동영상)
```
[6분 데모 영상 재생]
```

### 슬라이드 8: 차별화 포인트
```
✨ 우리만의 강점
1. 컨텍스트 인식 챗봇 (화면 기반 답변)
2. 기저질환 고려 운동 추천
3. OCR 수정 기능 (정확도 향상)
```

### 슬라이드 9: 향후 계획
```
🚀 Phase 1 (3개월)
- 실제 병원 파일럿 테스트
- 의료진 피드백 수집

🚀 Phase 2 (6개월)
- EMR 연동
- 웨어러블 기기 연동
```

### 슬라이드 10: Q&A
```
감사합니다!

GitHub: [레포지토리 링크]
Demo: [배포 URL]
```

---

## 22. 최종 체크리스트 (제출 전)

### 22.1 코드 체크리스트

```
□ requirements.txt 모든 패키지 버전 명시
□ .env.example 파일 작성 (실제 키 제외)
□ README.md 작성 (설치 방법, 실행 방법)
□ Docker Compose 정상 작동 확인
□ Celery 볼륨 마운트 확인
□ CORS 설정 확인 (localhost + 127.0.0.1)
□ 모든 API 엔드포인트 Swagger 문서화
□ 에러 처리 코드 작성
□ 로깅 설정 완료
```

### 22.2 문서 체크리스트

```
□ 00_unified_RDD.md (이 문서)
□ 01_Requirements.md (기능 명세)
□ 02_Database_Schema.md (ERD)
□ 03_API_Specification.md (API 문서)
□ 04_Deployment_Guide.md (배포 가이드)
□ 05_Test_Scenarios.md (테스트 시나리오)
□ seeds/exercises.json (30개 운동)
□ seeds/drug_interactions.json (30개 상호작용)
```

### 22.3 테스트 체크리스트

```
□ 페르소나 3명 시나리오 테스트 완료
□ OCR 정확도 90% 이상 (10장 테스트)
□ 약물 분석 정확도 95% 이상 (20개 테스트)
□ 챗봇 응답 정확도 90% 이상 (20개 질문)
□ 성능 테스트 (OCR 5초, 분석 15초, 챗봇 3초)
□ 모바일 반응형 테스트
□ 브라우저 호환성 테스트 (Chrome, Safari)
```

### 22.4 발표 준비 체크리스트

```
□ PPT 작성 완료 (10장)
□ 데모 영상 제작 (6분)
□ 시연 환경 테스트 (인터넷 연결, 화면 공유)
□ 백업 계획 (영상 재생, 스크린샷)
□ Q&A 예상 질문 준비
```

---

## 24. 문서 끝

**이 문서는 ChronicCare Ortho 프로젝트의 모든 요구사항을 정의합니다.**

**문서 작성자:** [이름]

**최종 수정일:** 2026-02-26

**문서 버전:** v2.0 (완전판)

---

- 원래 내용 100% 보존
- 시스템 아키텍처 추가
- requirements.txt 추가
- Docker Compose 수정 (Celery 볼륨, CORS)
- 조교님 보고용 섹션 추가
- 데모 시나리오 추가
- 발표 PPT 구성안 추가
- 최종 체크리스트 추가

**총 24개 섹션, 약 15,000 단어!** 📄✨
