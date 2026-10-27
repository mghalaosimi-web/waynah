import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Single-Flight PKCE Authorization Code Exchange Guard Unit Test
 *
 * Verifies that concurrent or double-invocations of code exchange
 * (e.g. under React 18 Strict Mode) share the same single in-flight Promise,
 * execute exchangeCodeForSession exactly once, handle success/failure cleanly,
 * and prevent race conditions or premature error state updates.
 */

describe('OAuth PKCE Callback — Single-Flight Deduplication Guard', () => {
  let inFlightExchanges: Map<string, Promise<{ session: any; error: any }>>;

  beforeEach(() => {
    inFlightExchanges = new Map();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function simulateCallbackExchange(
    code: string,
    exchangeFn: (c: string) => Promise<{ data: { session: any } | null; error: any }>,
    isSubscribed: boolean,
    onSuccess: (token: string) => void,
    onError: (err: any) => void
  ): Promise<string | null> {
    let exchangePromise = inFlightExchanges.get(code);

    if (!exchangePromise) {
      exchangePromise = exchangeFn(code)
        .then((res) => ({ session: res.data?.session || null, error: res.error || null }))
        .catch((err) => ({ session: null, error: err }));
      inFlightExchanges.set(code, exchangePromise);
    }

    const { session, error } = await exchangePromise;

    if (error) {
      if (isSubscribed) {
        onError(error);
      }
      return null;
    }

    const accessToken = session?.access_token || null;
    if (accessToken && isSubscribed) {
      onSuccess(accessToken);
    }
    return accessToken;
  }

  it('1. Single-flight Promise reuse: double execution for same code calls exchangeFn exactly ONCE', async () => {
    const exchangeFn = vi.fn().mockImplementation((c: string) =>
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ data: { session: { access_token: 'valid-token-' + c } }, error: null }),
          50
        )
      )
    );

    const onSuccess1 = vi.fn();
    const onError1 = vi.fn();
    const onSuccess2 = vi.fn();
    const onError2 = vi.fn();

    // Mount 1 (Effect 1 starts exchange and unmounts)
    const p1 = simulateCallbackExchange('code-123', exchangeFn, false, onSuccess1, onError1);

    // Mount 2 (Effect 2 runs concurrently while Mount 1 exchange is in-flight)
    const p2 = simulateCallbackExchange('code-123', exchangeFn, true, onSuccess2, onError2);

    const [res1, res2] = await Promise.all([p1, p2]);

    // Both invocations return the same token
    expect(res1).toBe('valid-token-code-123');
    expect(res2).toBe('valid-token-code-123');

    // exchangeFn must have been called EXACTLY ONCE
    expect(exchangeFn).toHaveBeenCalledTimes(1);

    // Mount 1 (unmounted, isSubscribed=false) did NOT trigger onSuccess or onError
    expect(onSuccess1).not.toHaveBeenCalled();
    expect(onError1).not.toHaveBeenCalled();

    // Mount 2 (active, isSubscribed=true) triggered onSuccess ONCE
    expect(onSuccess2).toHaveBeenCalledWith('valid-token-code-123');
    expect(onError2).not.toHaveBeenCalled();
  });

  it('2. Exchange failure handled ONCE on active subscription without premature error screen', async () => {
    const exchangeFn = vi.fn().mockImplementation(() =>
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ data: null, error: { message: 'Invalid PKCE grant', status: 400 } }),
          50
        )
      )
    );

    const onSuccess1 = vi.fn();
    const onError1 = vi.fn();
    const onSuccess2 = vi.fn();
    const onError2 = vi.fn();

    const p1 = simulateCallbackExchange('code-fail-1', exchangeFn, false, onSuccess1, onError1);
    const p2 = simulateCallbackExchange('code-fail-1', exchangeFn, true, onSuccess2, onError2);

    const [res1, res2] = await Promise.all([p1, p2]);

    expect(res1).toBeNull();
    expect(res2).toBeNull();
    expect(exchangeFn).toHaveBeenCalledTimes(1);

    // Unmounted effect 1 ignores error
    expect(onError1).not.toHaveBeenCalled();
    // Mounted effect 2 receives error once
    expect(onError2).toHaveBeenCalledTimes(1);
    expect(onError2).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid PKCE grant' }));
  });

  it('3. Sequential requests with DIFFERENT codes trigger distinct exchanges', async () => {
    const exchangeFn = vi.fn().mockImplementation((c: string) =>
      Promise.resolve({ data: { session: { access_token: 'token-' + c } }, error: null })
    );

    const resA = await simulateCallbackExchange('code-A', exchangeFn, true, vi.fn(), vi.fn());
    const resB = await simulateCallbackExchange('code-B', exchangeFn, true, vi.fn(), vi.fn());

    expect(resA).toBe('token-code-A');
    expect(resB).toBe('token-code-B');
    expect(exchangeFn).toHaveBeenCalledTimes(2);
  });
});
