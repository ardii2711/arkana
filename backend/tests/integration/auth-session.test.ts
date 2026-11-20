import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ApiClient, expectStatus } from '../helpers/client';
import { TEST_PASSWORD, cleanupTestUsers, createTestUser, loginAs } from '../helpers/fixtures';
import { startServer, stopServer } from '../helpers/server';

describe('autentikasi: rotasi dan pencabutan sesi', () => {
  beforeAll(async () => {
    await startServer();
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await stopServer();
  });

  it('refresh token hanya dapat dipakai sekali', async () => {
    const user = await createTestUser('rotasi');
    const client = await loginAs(user.email);
    const oldRefresh = client.cookie('arkana_refresh');

    await expectStatus(await client.request('/auth/refresh', { method: 'POST' }), 200);

    expect(client.cookie('arkana_refresh')).not.toBe(oldRefresh);

    const replayClient = new ApiClient(await startServer());
    replayClient.setCookie('arkana_refresh', oldRefresh ?? '', '/api/auth');

    const replay = await replayClient.request('/auth/refresh', { method: 'POST' });

    expect(replay.status).toBe(401);
    expect((replay.body as { error: { code: string } }).error.code).toBe('SESSION_EXPIRED');
  });

  it('logout mencabut refresh token', async () => {
    const user = await createTestUser('logout');
    const client = await loginAs(user.email);

    await expectStatus(await client.request('/auth/logout', { method: 'POST' }), 204);

    const result = await client.request('/auth/refresh', { method: 'POST' });

    expect(result.status).toBe(401);
  });

  it('ganti password menolak password lama yang salah dan mencabut sesi lain', async () => {
    const user = await createTestUser('ganti-password');
    const current = user.client;
    const other = await loginAs(user.email);

    const wrong = await current.request('/auth/password/change', {
      method: 'POST',
      json: { currentPassword: 'salah', newPassword: 'password-baru-123' },
    });

    expect(wrong.status).toBe(400);
    expect((wrong.body as { error: { code: string } }).error.code).toBe('INVALID_PASSWORD');

    await expectStatus(
      await current.request('/auth/password/change', {
        method: 'POST',
        json: { currentPassword: TEST_PASSWORD, newPassword: 'password-baru-123' },
      }),
      200,
    );

    const otherRefresh = await other.request('/auth/refresh', { method: 'POST' });

    expect(otherRefresh.status).toBe(401);
    await expectStatus(
      await current.request('/auth/login', {
        json: { email: user.email, password: 'password-baru-123' },
      }),
      200,
    );
  });
});
