import axios from 'axios';
import type { User } from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 - 401 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ─────────────────────────────────────────
// 처방전 분석 API
// ─────────────────────────────────────────

// 1. 처방전 이미지 업로드 (OCR 자동 실행)
export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/api/v1/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // { document_id, extracted_text, ... }
};

// 2. AI 분석 요청 (백그라운드 시작)
export const requestAnalysis = async (documentId: number, currentSymptom: string = "") => {
  const res = await apiClient.post(`/api/v1/analysis/${documentId}`, {
    current_symptom: currentSymptom,
  });
  return res.data; // { guide_result_id, status: "processing" }
};

// 3. 분석 상태 폴링
export const getAnalysisStatus = async (guideResultId: number) => {
  const res = await apiClient.get(`/api/v1/analysis/${guideResultId}/status`);
  return res.data;
};

// ─────────────────────────────────────────
// 재활 플랜 API
// ─────────────────────────────────────────

// 내 재활 플랜 목록 조회
export const getRehabPlans = async () => {
  const res = await apiClient.get('/api/v1/rehab/plans');
  return res.data; // { plans: [...] }
};

// 플랜 상세 조회 (운동 목록 포함)
export const getRehabPlanDetail = async (planId: number) => {
  const res = await apiClient.get(`/api/v1/rehab/plans/${planId}`);
  return res.data;
};

// 운동 완료 토글
export const toggleExerciseComplete = async (
  planId: number,
  rehabExerciseId: number,
  targetDate?: string
) => {
  const res = await apiClient.post(
    `/api/v1/rehab/plans/${planId}/exercises/${rehabExerciseId}/complete`,
    null,
    { params: { target_date: targetDate } }
  );
  return res.data;
};

// ─────────────────────────────────────────
// 계정 관리 API
// ─────────────────────────────────────────

// 내 정보 조회
export const getMyInfo = async () => {
  const res = await apiClient.get<User>('/api/v1/auth/me');
  return res.data; // { id, name, email, created_at, ... }
};

// 이름 수정
export const updateMyName = async (name: string) => {
  const res = await apiClient.patch('/api/v1/auth/me', { name });
  return res.data;
};

// 비밀번호 변경
export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}) => {
  const res = await apiClient.patch('/api/v1/auth/me/password', data);
  return res.data;
};

// 회원탈퇴
export const deleteAccount = async () => {
  const res = await apiClient.delete('/api/v1/auth/me');
  return res.data;
};
