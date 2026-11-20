import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ApiClient, expectStatus } from '../helpers/client';
import { TEST_PASSWORD, cleanupTestUsers, createTestUser } from '../helpers/fixtures';
import { startServer, stopServer } from '../helpers/server';

describe('autentikasi: login dan sesi', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await stopServer();
  });

  it('menolak password yang salah', async () => {
    const user = await createTestUser('login-gagal');
    const client = new ApiClient(baseUrl);

    const result = await client.request('/auth/login', {
      json: { email: user.email, password: 'password-salah' },
    });

    expect(result.status).toBe(401);
    expect((result.body as { error: { code: string } }).error.code).toBe('INVALID_CREDENTIALS');
  });

  it('login berhasil dan mengirim cookie akses serta refresh', async () => {
    const user = await createTestUser('login-berhasil');
    const client = new ApiClient(baseUrl);

    const result = await expectStatus(
      await client.request('/auth/login', { json: { email: user.email, password: TEST_PASSWORD } }),
      200,
    );
    const body = result.body as { data: { user: { email: string; role: string } } };

    expect(body.data.user.email).toBe(user.email);
    expect(body.data.user.role).toBe('USER');
    expect(client.hasCookie('arkana_access')).toBe(true);
    expect(client.hasCookie('arkana_refresh')).toBe(true);
  });

  it('/auth/me menolak permintaan tanpa cookie', async () => {
    const result = await new ApiClient(baseUrl).request('/auth/me');

    expect(result.status).toBe(401);
    expect((result.body as { error: { code: string } }).error.code).toBe('UNAUTHENTICATED');
  });

  it('/auth/me mengembalikan akun yang sedang login', async () => {
    const user = await createTestUser('me');
    const client = new ApiClient(baseUrl);

    await expectStatus(
      await client.request('/auth/login', { json: { email: user.email, password: TEST_PASSWORD } }),
      200,
    );
    const me = await expectStatus(await client.request('/auth/me'), 200);

    expect((me.body as { data: { user: { id: string } } }).data.user.id).toBe(user.id);
  });
});
