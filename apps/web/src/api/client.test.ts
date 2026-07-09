import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './client';

describe('api/client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('login posts credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 't', user: { id: '1', username: 'admin', displayName: '主管', role: 'supervisor', honorPoints: 0 } }),
      }),
    );
    const res = await api.login('admin', 'admin123');
    expect(res.accessToken).toBe('t');
    expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));
  });

  it('throws ApiError on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid credentials' }),
      }),
    );
    await expect(api.login('x', 'y')).rejects.toBeInstanceOf(ApiError);
  });

  it('getBroadcast fetches honors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );
    const data = await api.getBroadcast();
    expect(Array.isArray(data)).toBe(true);
  });
});
