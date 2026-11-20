import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ApiClient, expectStatus } from '../helpers/client';
import { cleanupTestUsers, createTestUser } from '../helpers/fixtures';
import { startServer, stopServer } from '../helpers/server';

describe('infrastruktur pengujian', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await stopServer();
  });

  it('health check berjalan', async () => {
    const response = await expectStatus(await new ApiClient(baseUrl).request('/health'), 200);

    expect((response.body as { data: { status: string } }).data.status).toBe('ok');
  });

  it('akun uji dapat dibuat, login, dan dibersihkan', async () => {
    const user = await createTestUser('smoke');

    const me = await expectStatus(await user.client.request('/auth/me'), 200);
    expect((me.body as { data: { user: { email: string } } }).data.user.email).toBe(user.email);

    await cleanupTestUsers();

    // Access token masih valid, tetapi requireAuth memuat ulang user dari database.
    const afterCleanup = await user.client.request('/auth/me');
    expect(afterCleanup.status).toBe(401);
  });
});
