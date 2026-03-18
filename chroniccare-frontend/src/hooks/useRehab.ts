import { useState, useEffect, useCallback } from 'react';
import { getRehabPlans, getRehabPlanDetail, toggleExerciseComplete } from '../api/client';

interface RehabPlan {
  plan_id: number;
  plan_name: string;
  exercises?: RehabExercise[];
  [key: string]: unknown;
}

interface RehabExercise {
  rehab_exercise_id: number;
  exercise_name: string;
  is_completed?: boolean;
  [key: string]: unknown;
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

export const useRehabPlans = () => {
  const [plans, setPlans] = useState<RehabPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRehabPlans();
      setPlans(data.plans ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, '재활 플랜을 불러오지 못했어요.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  return { plans, isLoading, error, refetch: fetchPlans };
};

export const useRehabPlanDetail = (planId: number | null) => {
  const [plan, setPlan] = useState<RehabPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!planId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data: RehabPlan = await getRehabPlanDetail(planId);
      setPlan(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, '플랜 상세를 불러오지 못했어요.'));
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const toggleExercise = useCallback(
    async (rehabExerciseId: number, targetDate?: string) => {
      if (!planId) return;
      try {
        await toggleExerciseComplete(planId, rehabExerciseId, targetDate);
        await fetchDetail();
      } catch (err: unknown) {
        setError(getErrorMessage(err, '운동 완료 처리에 실패했어요.'));
      }
    },
    [planId, fetchDetail]
  );

  return { plan, isLoading, error, toggleExercise, refetch: fetchDetail };
};
