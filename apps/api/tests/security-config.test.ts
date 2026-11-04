import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('securityConfig CORS origin policy', () => {
  it('keeps the canonical WAYNAH web origin and adds configured production origins', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CORS_ORIGIN', 'https://preview.waynah.app,https://waynah.vercel.app,https://localhost:3000,http://127.0.0.1:3001,*');
    vi.resetModules();

    const { securityConfig } = await import('../src/config/security.config.js');

    expect(securityConfig.corsOrigins).toContain('https://waynah.vercel.app');
    expect(securityConfig.corsOrigins).toContain('https://preview.waynah.app');
    expect(securityConfig.corsOrigins).not.toContain('*');
    expect(securityConfig.corsOrigins).not.toContain('https://localhost:3000');
    expect(securityConfig.corsOrigins).not.toContain('http://127.0.0.1:3001');
    expect(securityConfig.corsOrigins).not.toContain('http://localhost:3000');
  });

  it('keeps development loopback origins while adding configured origins', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('CORS_ORIGIN', 'https://local-preview.waynah.app');
    vi.resetModules();

    const { securityConfig } = await import('../src/config/security.config.js');

    expect(securityConfig.corsOrigins).toContain('https://waynah.vercel.app');
    expect(securityConfig.corsOrigins).toContain('https://local-preview.waynah.app');
    expect(securityConfig.corsOrigins).toContain('http://localhost:3000');
  });
});
