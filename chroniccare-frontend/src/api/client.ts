import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
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
