import { describe, expect, it } from 'vitest';
import { createServer } from '../src/server.js';

describe('GET /health', () => {
  it('reports degraded when the database health check is disconnected', async () => {
    const app = createServer(undefined, async () => ({
      connected: false,
      error: 'Database connection unavailable',
    }));

    const response = await app.request('/health');
    const body = await response.json();

    // Keep the existing HTTP contract while making the payload truthful.
    expect(response.status).toBe(200);
    expect(body.data.status).toBe('degraded');
    expect(body.data.database.connected).toBe(false);
  });

  it('reports ok when the database health check is connected', async () => {
    const app = createServer(undefined, async () => ({
      connected: true,
      postgisVersion: 'PostGIS test version',
    }));

    const response = await app.request('/health');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('ok');
    expect(body.data.database.connected).toBe(true);
  });
});
