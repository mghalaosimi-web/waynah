import { describe, expect, it } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';
import { securityConfig } from '../src/config/security.config.js';

const app = createServer({} as PrismaClient);
const allowedOrigin = securityConfig.corsOrigins.find((origin) => origin !== '*');

describe('Authentication route CORS', () => {
  it('answers register and me preflights for a configured origin with credential support', async () => {
    expect(allowedOrigin).toBeTruthy();

    for (const [path, method, headers] of [
      ['/v1/auth/register', 'POST', 'content-type'],
      ['/v1/auth/me', 'GET', 'authorization'],
    ]) {
      const response = await app.request(path, {
        method: 'OPTIONS',
        headers: {
          Origin: allowedOrigin!,
          'Access-Control-Request-Method': method,
          'Access-Control-Request-Headers': headers,
        },
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(allowedOrigin);
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain(method);
      expect(response.headers.get('Access-Control-Allow-Headers')?.toLowerCase()).toContain(headers);
    }
  });

  it('does not grant CORS access to an unconfigured origin', async () => {
    const response = await app.request('/v1/auth/register', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://untrusted.example',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(securityConfig.corsOrigins).not.toContain('*');
  });

  it('keeps CORS headers on API route errors for an allowed origin', async () => {
    const response = await app.request('/route-that-does-not-exist', {
      headers: { Origin: allowedOrigin! },
    });

    expect(response.status).toBe(404);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(allowedOrigin);
  });
});
