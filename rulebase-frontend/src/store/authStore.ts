import { create } from 'zustand';
import type { User } from '../types';

interface AuthStore {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

const stored = {
  token: localStorage.getItem('rulebase_token'),
  user: (() => {
    try {
      const u = localStorage.getItem('rulebase_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  })(),
};

export const useAuthStore = create<AuthStore>(set => ({
  token: stored.token,
  user: stored.user,
  setAuth: (token, user) => {
    localStorage.setItem('rulebase_token', token);
    localStorage.setItem('rulebase_user', JSON.stringify(user));
    set({ token, user });
  },
  clearAuth: () => {
    localStorage.removeItem('rulebase_token');
    localStorage.removeItem('rulebase_user');
    set({ token: null, user: null });
  },
}));
