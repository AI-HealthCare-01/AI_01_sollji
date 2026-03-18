import { useState, useEffect, useCallback } from 'react';
import {
  profileApi,
  type HealthProfileData,
  type ConditionData,
  type MedicationData,
  type AllergyData,
} from '../api/profileApi';

// ─── 타입 정의 ───────────────────────────────────────
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

interface FullProfile {
  health?: HealthProfileData;
  conditions?: unknown[];
  medications?: unknown[];
  allergies?: unknown[];
  [key: string]: unknown;
}

// ─── Hook ────────────────────────────────────────────
export const useProfile = () => {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await profileApi.getFullProfile();
      setProfile(res.data as FullProfile);
    } catch (err: unknown) {
      setError(getErrorMessage(err, '프로필을 불러오지 못했어요.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const updateHealth = useCallback(async (data: HealthProfileData) => {
    setIsSaving(true);
    try {
      await profileApi.upsertHealth(data);
      await fetchProfile();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '저장에 실패했어요.'));
    } finally {
      setIsSaving(false);
    }
  }, [fetchProfile]);

  const addCondition = useCallback(async (data: ConditionData) => {
    setIsSaving(true);
    try {
      await profileApi.addCondition(data);
      await fetchProfile();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '기저질환 추가에 실패했어요.'));
    } finally {
      setIsSaving(false);
    }
  }, [fetchProfile]);

  const removeCondition = useCallback(async (id: number) => {
    try {
      await profileApi.deleteCondition(id);
      await fetchProfile();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '기저질환 삭제에 실패했어요.'));
    }
  }, [fetchProfile]);

  const addMedication = useCallback(async (data: MedicationData) => {
    setIsSaving(true);
    try {
      await profileApi.addMedication(data);
      await fetchProfile();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '복용약 추가에 실패했어요.'));
    } finally {
      setIsSaving(false);
    }
  }, [fetchProfile]);

  const removeMedication = useCallback(async (id: number) => {
    try {
      await profileApi.deleteMedication(id);
      await fetchProfile();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '복용약 삭제에 실패했어요.'));
    }
  }, [fetchProfile]);

  const addAllergy = useCallback(async (data: AllergyData) => {
    setIsSaving(true);
    try {
      await profileApi.addAllergy(data);
      await fetchProfile();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '알레르기 추가에 실패했어요.'));
    } finally {
      setIsSaving(false);
    }
  }, [fetchProfile]);

  const removeAllergy = useCallback(async (id: number) => {
    try {
      await profileApi.deleteAllergy(id);
      await fetchProfile();
    } catch (err: unknown) {
      setError(getErrorMessage(err, '알레르기 삭제에 실패했어요.'));
    }
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    isSaving,
    error,
    fetchProfile,
    updateHealth,
    addCondition,
    removeCondition,
    addMedication,
    removeMedication,
    addAllergy,
    removeAllergy,
  };
};
