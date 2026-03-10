import apiClient from './client';

export const profileApi = {
  // 기본 건강정보
  upsertHealth: (data: HealthProfileData) =>
    apiClient.post('/api/v1/profile/health', data),

  // 기저질환
  addCondition: (data: ConditionData) =>
    apiClient.post('/api/v1/profile/conditions', data),
  deleteCondition: (id: number) =>
    apiClient.delete(`/api/v1/profile/conditions/${id}`),

  // 복용약
  addMedication: (data: MedicationData) =>
    apiClient.post('/api/v1/profile/medications', data),
  deleteMedication: (id: number) =>
    apiClient.delete(`/api/v1/profile/medications/${id}`),

  // 알레르기
  addAllergy: (data: AllergyData) =>
    apiClient.post('/api/v1/profile/allergies', data),
  deleteAllergy: (id: number) =>
    apiClient.delete(`/api/v1/profile/allergies/${id}`),

  // 전체 조회
  getFullProfile: () =>
    apiClient.get('/api/v1/profile/me'),
};

// Types
export interface HealthProfileData {
  height?: string;
  weight?: string;
  blood_type?: string;
  smoking_status?: string;
  alcohol_frequency?: string;
  exercise_frequency?: string;
}

export interface ConditionData {
  condition_type: string;
  diagnosed_date?: string;
  severity?: string;
  notes?: string;
}

export interface MedicationData {
  medication_name: string;
  dosage?: string;
  frequency?: number;
  timing?: Record<string, boolean>;
  medication_type?: string;
}

export interface AllergyData {
  allergen_name: string;
  allergen_type?: string;
  severity?: string;
  reaction_description?: string;
}
