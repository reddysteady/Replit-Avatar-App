import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest } from './apiUtils';

const originalFetch = globalThis.fetch;

describe('apiRequest', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('makes a request with correct options and returns response on success', async () => {
    const mockResponse = new Response('ok', { status: 200 });
    (globalThis.fetch as any).mockResolvedValueOnce(mockResponse);

    const res = await apiRequest('POST', 'https://example.com', { hello: 'world' });

    expect(globalThis.fetch).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hello: 'world' })
    });
    expect(res).toBe(mockResponse);
  });

  it('throws an error when response is not ok', async () => {
    const mockResponse = new Response('fail', { status: 400, statusText: 'Bad Request' });
    (globalThis.fetch as any).mockResolvedValueOnce(mockResponse);

    await expect(apiRequest('GET', 'https://example.com')).rejects.toThrow('400: fail');
  });
});
