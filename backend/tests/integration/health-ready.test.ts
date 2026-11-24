import { describe, expect, it } from 'vitest';

import { ApiClient, expectStatus } from '../helpers/client';
import { startServer, stopServer } from '../helpers/server';

describe('GET /api/health/ready', () => {
  it('melaporkan database dan storage siap tanpa membocorkan kredensial', async () => {
    const baseUrl = await startServer();

    try {
      const result = await expectStatus(await new ApiClient(baseUrl).request('/health/ready'), 200);

      expect(result.body).toEqual({
        success: true,
        data: { status: 'ready', checks: { database: 'ok', storage: 'ok' } },
      });
      expect(result.text).not.toContain(process.env.R2_ACCESS_KEY_ID ?? '');
      expect(result.text).not.toContain(process.env.R2_SECRET_ACCESS_KEY ?? '');
    } finally {
      await stopServer();
    }
  });
});
