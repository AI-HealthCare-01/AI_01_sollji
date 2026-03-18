// ─── 사용자 ───────────────────────────────────
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  created_at?: string;
}

// ─── 건강 프로필 (/api/v1/profile/me) ─────────
export interface FullProfile {
  user: {
    id: number;
    email: string;
    name: string;
  };
  conditions: {
    id: number;
    condition_type: string;
  }[];
  medications: {
    id: number;
    medication_name: string;
  }[];
  allergies: {
    id: number;
    allergen_name: string;
  }[];
  health_profile: object | null;
}

// ─── 문서 / 처방전 업로드 응답 ────────────────
export interface UploadDocumentResponse {
  document_id: number;
  extracted_text: string;
  status: string;
  created_at?: string;
}

// ─── 분석 요청 응답 ───────────────────────────
export interface AnalysisStartResponse {
  guide_result_id: number;
  status: 'processing';
}

// ─── 분석 이력 아이템 ─────────────────────────
export interface GuideHistory {
  guide_result_id: number;
  status: string;
  created_at: string;
  patient_name: string | null;
  diagnosis: string | null;
  hospital_name: string | null;
  summary: string | null;
}

// ─── 약물 상호작용 ────────────────────────────
export interface DrugInteraction {
  medication_a: string;
  medication_b: string;
  interaction_type: string;
  severity: 'high' | 'medium' | 'low';
  mechanism: string;
  recommendation: string;
}

// ─── 복약 스케줄 ──────────────────────────────
export interface MedicationSchedule {
  schedule_date: {
    drug_name: string;
    times: string[];
    with_food: boolean;
    duration_days: number;
  };
}

// ─── 처방전 분석 결과 상세 ────────────────────
export interface GuideDetail {
  guide_result_id: number;
  status: string;
  overall_safety_score: number;
  summary: string;
  medication_guide: string;
  lifestyle_guide: string;
  warning_signs: string;
  drug_interactions?: DrugInteraction[];
  medication_schedules?: MedicationSchedule[];
}

// ─── 운동 마스터 데이터 ───────────────────────
export interface ExerciseMaster {
  exercise_id: number;
  exercise_name: string;
  category: string;
  difficulty_level: string;
  instructions: string;
  video_url: string;
  thumbnail_url: string;
  tags: string[];
}

// ─── 재활 운동 항목 ───────────────────────────
export interface RehabExercise {
  rehab_exercise_id: number;
  week_number: number;
  sequence_order: number;
  sets: number;
  reps: number;
  duration_seconds: number | null;
  frequency_per_day: number;
  special_notes: string | null;
  exercise: ExerciseMaster | null;
}

// ─── 재활 플랜 목록 아이템 ────────────────────
export interface RehabPlan {
  id: number;
  target_area: string;
  duration_weeks: number;
  precautions: string;
  is_active: boolean;
  created_at: string;
}

// ─── 재활 플랜 상세 (운동 목록 포함) ──────────
export interface RehabPlanDetail extends RehabPlan {
  exercises: RehabExercise[];
}

// ─── 재활 진행률 ──────────────────────────────
export interface RehabProgress {
  date: string;
  total_exercises: number;
  completed_exercises: number;
  progress_percent: number;
  completed_exercise_ids: number[];
  current_week?: number;
}

// ─── 채팅 세션 ────────────────────────────────
export interface ChatSession {
  session_id: number;
  context_type: 'general' | 'guide';
  session_status: 'ACTIVE' | 'CLOSED';
  started_at: string;
}

// ─── 채팅 메시지 ──────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── 복약 (기존 유지) ─────────────────────────
export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
}

// ─── API 공통 응답 ────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
