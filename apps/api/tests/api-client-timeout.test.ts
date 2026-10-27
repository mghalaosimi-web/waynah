import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../web/lib/api/api-client.js';

describe('Web auth API request timeout', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ends a stalled registration with a clear result and no automatic retry', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    );
    const client = new ApiClient('https://api.example');

    const resultPromise = client.register({ name: 'Test User', email: 'test@example.com', password: 'password' });
    await vi.advanceTimersByTimeAsync(15_000);
    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.error).toContain('قد يكون الخادم أكمل إنشاء الحساب');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
