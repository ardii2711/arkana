import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { expectStatus } from '../helpers/client';
import {
  ADMIN_EMAIL,
  TEST_EMAIL_DOMAIN,
  cleanupTestUsers,
  createTestUser,
  ensureAdmin,
} from '../helpers/fixtures';
import { PNG_BYTES, fileForm } from '../helpers/files';
import { startServer, stopServer } from '../helpers/server';

interface AdminAccount {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  hasAvatar: boolean;
  avatarKey?: string;
}

describe('pengelolaan akun oleh Admin', () => {
  beforeAll(async () => {
    await startServer();
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await stopServer();
  });

  it('memfilter daftar akun berdasarkan status dan pencarian sekaligus', async () => {
    const admin = await ensureAdmin();
    const email = `e2e.filter.${Date.now()}@${TEST_EMAIL_DOMAIN}`;

    await expectStatus(
      await admin.client.request('/users/invite', {
        method: 'POST',
        json: { name: 'Calon Akun Filter', email },
      }),
      201,
    );

    const result = await expectStatus(
      await admin.client.request(`/users?status=INVITED&search=${encodeURIComponent(email)}`),
      200,
    );
    const data = result.body as { data: { items: AdminAccount[]; total: number } };

    expect(data.data.total).toBe(1);
    expect(data.data.items[0]?.email).toBe(email);
    expect(data.data.items[0]?.hasAvatar).toBe(false);
    expect(data.data.items[0]?.avatarKey).toBeUndefined();
  });

  it('menolak undangan dengan email yang sudah terdaftar', async () => {
    const admin = await ensureAdmin();
    const existing = await createTestUser('undangan-ganda');

    const result = await admin.client.request('/users/invite', {
      method: 'POST',
      json: { name: 'Duplikat', email: existing.email },
    });

    expect(result.status).toBe(409);
    expect((result.body as { error: { code: string } }).error.code).toBe('EMAIL_TAKEN');
  });

  it('kirim ulang undangan hanya untuk akun berstatus INVITED', async () => {
    const admin = await ensureAdmin();
    const invitedEmail = `e2e.ulang.${Date.now()}@${TEST_EMAIL_DOMAIN}`;

    const invited = await expectStatus(
      await admin.client.request('/users/invite', {
        method: 'POST',
        json: { name: 'Akun Diundang', email: invitedEmail },
      }),
      201,
    );
    const invitedId = (invited.body as { data: { user: AdminAccount } }).data.user.id;

    await expectStatus(
      await admin.client.request(`/users/${invitedId}/resend-invitation`, { method: 'POST' }),
      200,
    );

    const active = await createTestUser('aktif-ulang');
    const rejected = await admin.client.request(`/users/${active.id}/resend-invitation`, {
      method: 'POST',
    });

    expect(rejected.status).toBe(400);
    expect((rejected.body as { error: { code: string } }).error.code).toBe('INVALID_STATUS');
  });

  it('mengubah data akun dan menolak aktivasi sebelum password dibuat', async () => {
    const admin = await ensureAdmin();
    const email = `e2e.ubah.${Date.now()}@${TEST_EMAIL_DOMAIN}`;
    const invited = await expectStatus(
      await admin.client.request('/users/invite', {
        method: 'POST',
        json: { name: 'Nama Awal', email },
      }),
      201,
    );
    const id = (invited.body as { data: { user: AdminAccount } }).data.user.id;

    const renamed = await expectStatus(
      await admin.client.request(`/users/${id}`, { method: 'PATCH', json: { name: 'Nama Baru' } }),
      200,
    );

    expect((renamed.body as { data: { user: AdminAccount } }).data.user.name).toBe('Nama Baru');

    const activation = await admin.client.request(`/users/${id}`, {
      method: 'PATCH',
      json: { status: 'ACTIVE' },
    });

    expect(activation.status).toBe(400);
    expect((activation.body as { error: { code: string } }).error.code).toBe(
      'ACCOUNT_NOT_ACTIVATED',
    );

    const other = await createTestUser('email-dipakai');
    const taken = await admin.client.request(`/users/${id}`, {
      method: 'PATCH',
      json: { email: other.email },
    });

    expect(taken.status).toBe(409);
  });

  it('menonaktifkan akun mencabut akses tanpa menghapus data', async () => {
    const admin = await ensureAdmin();
    const user = await createTestUser('nonaktif');

    await expectStatus(
      await admin.client.request(`/users/${user.id}`, {
        method: 'PATCH',
        json: { status: 'INACTIVE' },
      }),
      200,
    );

    expect((await user.client.request('/auth/me')).status).toBe(401);

    await expectStatus(
      await admin.client.request(`/users/${user.id}`, {
        method: 'PATCH',
        json: { status: 'ACTIVE' },
      }),
      200,
    );

    expect((await user.client.request('/auth/me')).status).toBe(200);
  });

  it('menampilkan avatar akun User untuk Admin tanpa membuka avatar Admin', async () => {
    const admin = await ensureAdmin();
    const user = await createTestUser('avatar-admin');

    await expectStatus(
      await user.client.request('/profile/avatar', {
        method: 'POST',
        form: fileForm('avatar.png', 'image/png', PNG_BYTES),
      }),
      201,
    );

    const avatar = await admin.client.requestRaw(`/users/${user.id}/avatar`);

    expect(avatar.status).toBe(200);
    expect(avatar.bytes.equals(PNG_BYTES)).toBe(true);

    expect((await admin.client.requestRaw(`/users/${admin.id}/avatar`)).status).toBe(404);
    expect((await admin.client.requestRaw(`/users/${randomUUID()}/avatar`)).status).toBe(404);
  });

  it('menghapus akun User beserta datanya dan menolak penghapusan Admin', async () => {
    const admin = await ensureAdmin();
    const user = await createTestUser('hapus');

    await expectStatus(
      await user.client.request('/notes', {
        method: 'POST',
        json: { content: 'Catatan yang ikut terhapus' },
      }),
      201,
    );

    await expectStatus(await admin.client.request(`/users/${user.id}`, { method: 'DELETE' }), 204);

    expect((await user.client.request('/auth/me')).status).toBe(401);

    const listed = await expectStatus(
      await admin.client.request(`/users?search=${encodeURIComponent(user.email)}`),
      200,
    );

    expect((listed.body as { data: { total: number } }).data.total).toBe(0);

    const deleteAdmin = await admin.client.request(`/users/${admin.id}`, { method: 'DELETE' });

    expect(deleteAdmin.status).toBe(403);
    expect((deleteAdmin.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');

    expect(
      (await admin.client.request(`/users/${randomUUID()}`, { method: 'DELETE' })).status,
    ).toBe(404);
  });

  it('mengenali akun Admin pada daftar', async () => {
    const admin = await ensureAdmin();
    const listed = await expectStatus(
      await admin.client.request(`/users?search=${encodeURIComponent(ADMIN_EMAIL)}`),
      200,
    );
    const items = (listed.body as { data: { items: AdminAccount[] } }).data.items;

    expect(items.some((item) => item.role === 'ADMIN')).toBe(true);
  });
});
