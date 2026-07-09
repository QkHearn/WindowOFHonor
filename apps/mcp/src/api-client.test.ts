import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { HonorApiClient } from './api-client.js';

describe('HonorApiClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.API_BASE_URL = 'http://api.test';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends service token and user id headers', async () => {
    let capturedHeaders: HeadersInit | undefined;

    globalThis.fetch = mock.fn(async (_url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify([{ id: '1' }]), { status: 200 });
    }) as typeof fetch;

    const client = new HonorApiClient('svc-token', 'user-123');
    const data = await client.getBroadcast();

    assert.equal(Array.isArray(data), true);
    const headers = capturedHeaders as Record<string, string>;
    assert.equal(headers['X-Service-Token'], 'svc-token');
    assert.equal(headers['X-User-Id'], 'user-123');
  });

  it('throws on API error', async () => {
    globalThis.fetch = mock.fn(async () => {
      return new Response('not found', { status: 404 });
    }) as typeof fetch;

    const client = new HonorApiClient('svc-token');
    await assert.rejects(() => client.getUserHonors('missing'), /404/);
  });

  it('builds leaderboard query params', async () => {
    let capturedUrl = '';

    globalThis.fetch = mock.fn(async (url: string) => {
      capturedUrl = url;
      return new Response(JSON.stringify([]), { status: 200 });
    }) as typeof fetch;

    const client = new HonorApiClient('svc-token');
    await client.getPersonalLeaderboard('company', 'month', 5);

    assert.match(capturedUrl, /scope=company/);
    assert.match(capturedUrl, /period=month/);
    assert.match(capturedUrl, /limit=5/);
  });

  it('calls external query endpoints', async () => {
    let capturedUrl = '';

    globalThis.fetch = mock.fn(async (url: string) => {
      capturedUrl = url;
      return new Response(JSON.stringify({ date: '2026-07-09' }), { status: 200 });
    }) as typeof fetch;

    const client = new HonorApiClient('svc-token');
    await client.queryToday();

    assert.match(capturedUrl, /\/api\/queries\/today/);
  });
});
