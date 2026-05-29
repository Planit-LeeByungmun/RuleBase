import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

vi.mock('axios', () => {
  const interceptors = {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  };
  const instance = {
    interceptors,
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => instance),
    },
  };
});

describe('axios instance', () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
  });

  it('creates instance with correct base config', async () => {
    await import('./axios');
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:4000/api/v1',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('request interceptor adds Authorization header when token exists', async () => {
    localStorage.setItem('rulebase_token', 'test-token');
    await import('./axios');

    const instance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value;
    const requestInterceptor = instance.interceptors.request.use.mock.calls[0][0];

    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('request interceptor skips Authorization when no token', async () => {
    await import('./axios');

    const instance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value;
    const requestInterceptor = instance.interceptors.request.use.mock.calls[0][0];

    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('response interceptor passes through successful responses', async () => {
    await import('./axios');

    const instance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value;
    const [onSuccess] = instance.interceptors.response.use.mock.calls[0];

    const response = { data: 'ok', status: 200 } as AxiosResponse;
    expect(onSuccess(response)).toBe(response);
  });

  it('response interceptor clears storage and redirects on 401', async () => {
    localStorage.setItem('rulebase_token', 'old-token');
    localStorage.setItem('rulebase_user', '{}');

    // Mock window.location
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
    });

    await import('./axios');

    const instance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value;
    const [, onError] = instance.interceptors.response.use.mock.calls[0];

    const error = { response: { status: 401 } } as AxiosError;
    await expect(onError(error)).rejects.toBe(error);

    expect(localStorage.getItem('rulebase_token')).toBeNull();
    expect(localStorage.getItem('rulebase_user')).toBeNull();
    expect(window.location.href).toBe('/auth');

    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  it('response interceptor rejects non-401 errors without redirect', async () => {
    const hrefBefore = window.location.href;
    await import('./axios');

    const instance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value;
    const [, onError] = instance.interceptors.response.use.mock.calls[0];

    const error = { response: { status: 500 } } as AxiosError;
    await expect(onError(error)).rejects.toBe(error);
    expect(window.location.href).toBe(hrefBefore);
  });
});
