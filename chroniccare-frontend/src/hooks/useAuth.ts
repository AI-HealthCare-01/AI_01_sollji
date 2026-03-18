import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, isProfileCompleted, setUser, setProfileCompleted, logout } =
    useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isProfileCompleted,
    setUser,
    setProfileCompleted,
    logout,
  };
};
