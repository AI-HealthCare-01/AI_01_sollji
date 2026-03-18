import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isProfileCompleted: boolean;
  setUser: (user: User, token: string) => void;
  updateUser: (data: Partial<User>) => void;
  setProfileCompleted: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isProfileCompleted: false,

      setUser: (user, token) => {
        sessionStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      // 이름 등 유저 정보 부분 업데이트
      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      // 프로필 설정 완료 여부
      setProfileCompleted: (value) => {
        set({ isProfileCompleted: value });
      },

      logout: () => {
        sessionStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isProfileCompleted: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
