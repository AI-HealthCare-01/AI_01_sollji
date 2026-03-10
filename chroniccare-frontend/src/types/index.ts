// 사용자
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
}

// 복약
export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
}

// 재활 운동
export interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: number;
  duration?: number;
  completed: boolean;
}

// API 응답 공통 타입
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
