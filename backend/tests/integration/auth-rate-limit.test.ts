import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ApiClient } from '../helpers/client';
import { TEST_EMAIL_DOMAIN, cleanupTestUsers } from '../helpers/fixtures';
import { startServer, stopServer } from '../helpers/server';

describe('autentikasi: rate limit login', () => {
  beforeAll(async () => {
    await startServer();
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await stopServer();
  });

  it('membatasi percobaan login per IP setelah 10 permintaan', async () => {
    const client = new ApiClient(await startServer());
    const statuses: number[] = [];

    for (let index = 1; index <= 11; index += 1) {
      const result = await client.request('/auth/login', {
        json: { email: `tidak-ada-${index}@${TEST_EMAIL_DOMAIN}`, password: 'salah' },
      });

      statuses.push(result.status);

      if (result.status === 429) {
        expect((result.body as { error: { code: string } }).error.code).toBe('RATE_LIMITED');
      }
    }

    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});
