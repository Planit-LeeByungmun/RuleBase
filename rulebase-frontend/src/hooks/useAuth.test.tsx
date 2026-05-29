import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  role: 'user',
};

const mockAdmin: User = {
  id: 2,
  email: 'admin@example.com',
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
};

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null, user: null });
});

describe('useAuth', () => {
  it('returns unauthenticated when no token or user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('returns authenticated after setAuth', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setAuth('test-token', mockUser);
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('test-token');
    expect(result.current.user).toEqual(mockUser);
  });

  it('returns isAdmin true for admin user', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setAuth('admin-token', mockAdmin);
    });
    expect(result.current.isAdmin).toBe(true);
  });

  it('returns isAdmin false for regular user', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setAuth('token', mockUser);
    });
    expect(result.current.isAdmin).toBe(false);
  });

  it('clears auth on logout', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setAuth('token', mockUser);
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('persists auth to localStorage', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setAuth('token', mockUser);
    });
    expect(localStorage.getItem('rulebase_token')).toBe('token');
    expect(JSON.parse(localStorage.getItem('rulebase_user')!)).toEqual(mockUser);
  });

  it('clears localStorage on logout', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setAuth('token', mockUser);
    });
    act(() => {
      result.current.logout();
    });
    expect(localStorage.getItem('rulebase_token')).toBeNull();
    expect(localStorage.getItem('rulebase_user')).toBeNull();
  });
});
