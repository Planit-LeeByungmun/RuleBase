import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from '../types';

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  role: 'user',
};

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null, user: null });
});

describe('authStore', () => {
  describe('initial state', () => {
    it('starts with null token and user', () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('sets token and user in store', () => {
      useAuthStore.getState().setAuth('my-token', mockUser);
      const state = useAuthStore.getState();
      expect(state.token).toBe('my-token');
      expect(state.user).toEqual(mockUser);
    });

    it('persists token to localStorage', () => {
      useAuthStore.getState().setAuth('my-token', mockUser);
      expect(localStorage.getItem('rulebase_token')).toBe('my-token');
    });

    it('persists user to localStorage as JSON', () => {
      useAuthStore.getState().setAuth('my-token', mockUser);
      expect(JSON.parse(localStorage.getItem('rulebase_user')!)).toEqual(mockUser);
    });
  });

  describe('clearAuth', () => {
    it('clears token and user from store', () => {
      useAuthStore.getState().setAuth('my-token', mockUser);
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
    });

    it('removes token from localStorage', () => {
      useAuthStore.getState().setAuth('my-token', mockUser);
      useAuthStore.getState().clearAuth();
      expect(localStorage.getItem('rulebase_token')).toBeNull();
    });

    it('removes user from localStorage', () => {
      useAuthStore.getState().setAuth('my-token', mockUser);
      useAuthStore.getState().clearAuth();
      expect(localStorage.getItem('rulebase_user')).toBeNull();
    });
  });
});
