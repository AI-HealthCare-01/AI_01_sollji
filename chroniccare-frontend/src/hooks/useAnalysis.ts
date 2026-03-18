import { useState, useCallback } from 'react';
import { uploadDocument, requestAnalysis, getAnalysisStatus } from '../api/client';

interface AnalysisResult {
  status: string;
  guide_result_id: number;
  medications?: unknown[];
  drug_interactions?: unknown[];
  medication_schedules?: unknown[];
  [key: string]: unknown;
}

interface AnalysisState {
  isUploading: boolean;
  isAnalyzing: boolean;
  documentId: number | null;
  guideResultId: number | null;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  result: AnalysisResult | null;
  error: string | null;
}

// axios 에러 타입 헬퍼
interface AxiosLikeError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as AxiosLikeError;
  return e?.response?.data?.detail ?? fallback;
};

export const useAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({
    isUploading: false,
    isAnalyzing: false,
    documentId: null,
    guideResultId: null,
    status: 'idle',
    result: null,
    error: null,
  });

  // 폴링 함수
  const pollStatus = useCallback(async (guideResultId: number) => {
    const MAX_ATTEMPTS = 30;
    const INTERVAL_MS = 3000;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));

      try {
        const data: AnalysisResult = await getAnalysisStatus(guideResultId);

        if (data.status === 'completed') {
          setState((prev) => ({
            ...prev,
            isAnalyzing: false,
            status: 'completed',
            result: data,
          }));
          return;
        }

        if (data.status === 'failed') {
          setState((prev) => ({
            ...prev,
            isAnalyzing: false,
            status: 'failed',
            error: '분석에 실패했어요. 다시 시도해주세요.',
          }));
          return;
        }
      } catch {
        // 일시적 네트워크 오류는 무시하고 계속 폴링
      }
    }

    // 타임아웃
    setState((prev) => ({
      ...prev,
      isAnalyzing: false,
      status: 'failed',
      error: '분석 시간이 초과됐어요. 다시 시도해주세요.',
    }));
  }, []);

  // 업로드 + 분석 시작
  const startAnalysis = useCallback(
    async (file: File, currentSymptom: string = '') => {
      setState((prev) => ({ ...prev, isUploading: true, status: 'uploading', error: null }));

      try {
        // 1단계: 업로드
        const uploadResult = await uploadDocument(file);
        const documentId: number = uploadResult.document_id;

        setState((prev) => ({
          ...prev,
          isUploading: false,
          isAnalyzing: true,
          documentId,
          status: 'processing',
        }));

        // 2단계: 분석 요청
        const analysisResult = await requestAnalysis(documentId, currentSymptom);
        const guideResultId: number = analysisResult.guide_result_id;

        setState((prev) => ({ ...prev, guideResultId }));

        // 3단계: 폴링
        await pollStatus(guideResultId);
      } catch (err: unknown) {
        // ✅ any → unknown + 헬퍼 함수로 처리
        setState((prev) => ({
          ...prev,
          isUploading: false,
          isAnalyzing: false,
          status: 'failed',
          error: getErrorMessage(err, '오류가 발생했어요.'),
        }));
      }
    },
    [pollStatus]
  );

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      isAnalyzing: false,
      documentId: null,
      guideResultId: null,
      status: 'idle',
      result: null,
      error: null,
    });
  }, []);

  return { ...state, startAnalysis, reset };
};
