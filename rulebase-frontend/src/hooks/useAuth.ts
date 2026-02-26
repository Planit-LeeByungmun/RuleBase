import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  return {
    isAuthenticated: !!token && !!user,
    user,
    token,
    setAuth,
    logout: clearAuth,
    isAdmin: user?.role === 'admin',
  };
}
