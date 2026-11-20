import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ApiClient, expectStatus } from '../helpers/client';
import {
  TEST_EMAIL_DOMAIN,
  cleanupTestUsers,
  createTestUser,
  ensureAdmin,
} from '../helpers/fixtures';
import { clearMailbox, extractToken, waitForEmail } from '../helpers/mail';
import { startServer, stopServer } from '../helpers/server';

const MIN_PASSWORD = 'password-baru-123';
const MAIL_TIMEOUT_MS = 25_000;

describe('autentikasi: aktivasi dan reset password lewat email', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
    await cleanupTestUsers();
    await clearMailbox();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await stopServer();
  });

  it('aktivasi akun memakai token undangan dari email', async () => {
    const admin = await ensureAdmin();
    const email = `e2e.aktivasi.${Date.now()}@${TEST_EMAIL_DOMAIN}`;

    await expectStatus(
      await admin.client.request('/users/invite', {
        method: 'POST',
        json: { name: 'User Aktivasi', email },
      }),
      201,
    );

    const mail = await waitForEmail(email, MAIL_TIMEOUT_MS);
    const token = extractToken(`${mail.Text}\n${mail.HTML}`);
    const guest = new ApiClient(baseUrl);

    const info = await expectStatus(await guest.request(`/auth/activation/${token}`), 200);

    expect((info.body as { data: { email: string } }).data.email).toBe(email);

    await expectStatus(
      await guest.request('/auth/activate', {
        method: 'POST',
        json: { token, password: MIN_PASSWORD },
      }),
      200,
    );

    await expectStatus(
      await guest.request('/auth/login', { json: { email, password: MIN_PASSWORD } }),
      200,
    );

    const reused = await guest.request(`/auth/activation/${token}`);

    expect(reused.status).toBe(400);
    expect((reused.body as { error: { code: string } }).error.code).toBe('INVALID_TOKEN');
  });

  it('reset password memakai token sekali pakai dan mencabut sesi lama', async () => {
    const user = await createTestUser('reset');
    const existingSession = user.client;
    const guest = new ApiClient(baseUrl);

    await expectStatus(
      await guest.request('/auth/password/forgot', {
        method: 'POST',
        json: { email: user.email },
      }),
      200,
    );

    const mail = await waitForEmail(user.email, MAIL_TIMEOUT_MS);
    const token = extractToken(`${mail.Text}\n${mail.HTML}`);

    await expectStatus(
      await guest.request('/auth/password/reset', {
        method: 'POST',
        json: { token, password: MIN_PASSWORD },
      }),
      200,
    );

    await expectStatus(
      await guest.request('/auth/login', { json: { email: user.email, password: MIN_PASSWORD } }),
      200,
    );

    const oldPassword = await guest.request('/auth/login', {
      json: { email: user.email, password: 'arkana-test-1234' },
    });

    expect(oldPassword.status).toBe(401);

    const reused = await guest.request('/auth/password/reset', {
      method: 'POST',
      json: { token, password: MIN_PASSWORD },
    });

    expect(reused.status).toBe(400);
    expect((reused.body as { error: { code: string } }).error.code).toBe('INVALID_TOKEN');

    // Access token lama masih JWT valid, tetapi sesi refresh sudah dicabut.
    expect((await existingSession.request('/auth/refresh', { method: 'POST' })).status).toBe(401);
  });

  it('permintaan reset untuk email tak terdaftar tetap dibalas netral', async () => {
    const guest = new ApiClient(baseUrl);
    const result = await expectStatus(
      await guest.request('/auth/password/forgot', {
        method: 'POST',
        json: { email: `tidak-terdaftar@${TEST_EMAIL_DOMAIN}` },
      }),
      200,
    );

    expect((result.body as { data: { sent: boolean } }).data.sent).toBe(true);
  });
});
