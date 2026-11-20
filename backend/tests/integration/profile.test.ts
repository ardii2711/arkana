import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ApiClient, expectStatus } from '../helpers/client';
import {
  TEST_EMAIL_DOMAIN,
  TEST_PASSWORD,
  cleanupTestUsers,
  createTestUser,
} from '../helpers/fixtures';
import { PNG_BYTES, PDF_BYTES, fileForm } from '../helpers/files';
import { clearMailbox, extractToken, waitForEmail } from '../helpers/mail';
import { startServer, stopServer } from '../helpers/server';

const NIP_A = '198001012006041001';
const NIP_B = '198001012006041002';

describe('profil pengguna', () => {
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

  it('memperbarui data kepegawaian dan mengembalikannya pada sesi aktif', async () => {
    const user = await createTestUser('profil');

    const updated = await expectStatus(
      await user.client.request('/profile', {
        method: 'PATCH',
        json: {
          name: 'Nama Baru',
          titleBefore: 'Dr.',
          titleAfter: 'M.Si',
          nip: NIP_A,
          employeeStatus: 'PNS',
          golongan: 'III/a',
          position: 'Analis Kebijakan',
          unit: 'Biro Umum',
        },
      }),
      200,
    );
    const profile = (updated.body as { data: { user: Record<string, unknown> } }).data.user;

    expect(profile).toMatchObject({
      name: 'Nama Baru',
      nip: NIP_A,
      employeeStatus: 'PNS',
      golongan: 'III/a',
      position: 'Analis Kebijakan',
    });

    const me = await expectStatus(await user.client.request('/auth/me'), 200);

    expect((me.body as { data: { user: { nip: string } } }).data.user.nip).toBe(NIP_A);

    await expectStatus(
      await user.client.request('/profile', { method: 'PATCH', json: { position: null } }),
      200,
    );

    const cleared = await expectStatus(await user.client.request('/auth/me'), 200);

    expect(
      (cleared.body as { data: { user: { position: string | null } } }).data.user.position,
    ).toBe(null);
  });

  it('menolak NIP tidak valid dan NIP yang sudah dipakai akun lain', async () => {
    const first = await createTestUser('nip-a');
    const second = await createTestUser('nip-b');

    const invalid = await first.client.request('/profile', {
      method: 'PATCH',
      json: { nip: '123' },
    });

    expect(invalid.status).toBe(400);
    expect((invalid.body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');

    await expectStatus(
      await first.client.request('/profile', { method: 'PATCH', json: { nip: NIP_B } }),
      200,
    );

    const taken = await second.client.request('/profile', {
      method: 'PATCH',
      json: { nip: NIP_B },
    });

    expect(taken.status).toBe(409);
    expect((taken.body as { error: { code: string } }).error.code).toBe('NIP_TAKEN');
  });

  it('menolak patch profil tanpa field', async () => {
    const user = await createTestUser('profil-kosong');
    const result = await user.client.request('/profile', { method: 'PATCH', json: {} });

    expect(result.status).toBe(400);
  });

  it('mengelola avatar: unggah, baca, validasi, dan hapus', async () => {
    const user = await createTestUser('avatar');

    expect((await user.client.request('/profile/avatar')).status).toBe(404);

    const uploaded = await expectStatus(
      await user.client.request('/profile/avatar', {
        method: 'POST',
        form: fileForm('avatar.png', 'image/png', PNG_BYTES),
      }),
      201,
    );

    expect((uploaded.body as { data: { hasAvatar: boolean } }).data.hasAvatar).toBe(true);

    const avatar = await user.client.requestRaw('/profile/avatar');

    expect(avatar.status).toBe(200);
    expect(avatar.headers.get('content-type')).toContain('image/png');
    expect(avatar.bytes.equals(PNG_BYTES)).toBe(true);

    const invalidType = await user.client.request('/profile/avatar', {
      method: 'POST',
      form: fileForm('avatar.pdf', 'application/pdf', PDF_BYTES),
    });

    expect(invalidType.status).toBe(400);
    expect((invalidType.body as { error: { code: string } }).error.code).toBe('INVALID_FILE_TYPE');

    const tooLarge = await user.client.request('/profile/avatar', {
      method: 'POST',
      form: fileForm('besar.png', 'image/png', Buffer.alloc(2 * 1024 * 1024 + 1)),
    });

    expect(tooLarge.status).toBe(400);
    expect((tooLarge.body as { error: { code: string } }).error.code).toBe('AVATAR_TOO_LARGE');

    await expectStatus(await user.client.request('/profile/avatar', { method: 'DELETE' }), 200);
    expect((await user.client.request('/profile/avatar')).status).toBe(404);
  });

  it('mengubah email melalui verifikasi token', async () => {
    const user = await createTestUser('email');
    const newEmail = `e2e.email-baru.${Date.now()}@${TEST_EMAIL_DOMAIN}`;
    const guest = new ApiClient(baseUrl);

    await expectStatus(
      await user.client.request('/profile/email', { method: 'POST', json: { email: newEmail } }),
      200,
    );

    const me = await expectStatus(await user.client.request('/auth/me'), 200);
    expect((me.body as { data: { user: { pendingEmail: string } } }).data.user.pendingEmail).toBe(
      newEmail,
    );

    const mail = await waitForEmail(newEmail, 25_000);
    const token = extractToken(`${mail.Text}\n${mail.HTML}`);

    await expectStatus(
      await guest.request('/profile/email/verify', { method: 'POST', json: { token } }),
      200,
    );

    await expectStatus(
      await guest.request('/auth/login', { json: { email: newEmail, password: TEST_PASSWORD } }),
      200,
    );

    const oldEmail = await guest.request('/auth/login', {
      json: { email: user.email, password: TEST_PASSWORD },
    });

    expect(oldEmail.status).toBe(401);
  });

  it('menolak email sama dan email milik akun lain', async () => {
    const first = await createTestUser('email-sama');
    const second = await createTestUser('email-lain');

    const same = await first.client.request('/profile/email', {
      method: 'POST',
      json: { email: first.email },
    });

    expect(same.status).toBe(400);
    expect((same.body as { error: { code: string } }).error.code).toBe('EMAIL_UNCHANGED');

    const taken = await first.client.request('/profile/email', {
      method: 'POST',
      json: { email: second.email },
    });

    expect(taken.status).toBe(409);
    expect((taken.body as { error: { code: string } }).error.code).toBe('EMAIL_TAKEN');
  });
});
