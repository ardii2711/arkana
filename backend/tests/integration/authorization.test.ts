import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ApiClient, expectStatus } from '../helpers/client';
import { cleanupTestUsers, createTestUser, ensureAdmin } from '../helpers/fixtures';
import { startServer, stopServer } from '../helpers/server';

const userEndpoints = [
  '/work-logs',
  '/archive/folders',
  '/archive/files',
  '/notes',
  '/schedules',
  '/dashboard',
  '/profile/avatar',
];

describe('otorisasi', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await stopServer();
  });

  it('menolak permintaan tanpa sesi pada seluruh endpoint data pribadi', async () => {
    const guest = new ApiClient(baseUrl);

    for (const path of userEndpoints) {
      const result = await guest.request(path);

      expect(result.status, path).toBe(401);
      expect((result.body as { error: { code: string } }).error.code, path).toBe('UNAUTHENTICATED');
    }
  });

  it('menolak Admin pada endpoint data pribadi User', async () => {
    const admin = await ensureAdmin();

    for (const path of ['/work-logs', '/notes', '/schedules', '/dashboard']) {
      const result = await admin.client.request(path);

      expect(result.status, path).toBe(403);
      expect((result.body as { error: { code: string } }).error.code, path).toBe('FORBIDDEN');
    }
  });

  it('menolak User pada endpoint khusus Admin', async () => {
    const user = await createTestUser('otorisasi-user');

    const requests = [
      await user.client.request('/users'),
      await user.client.request('/users/invite', {
        method: 'POST',
        json: { name: 'X', email: `x.${Date.now()}@e2e.arkana.test` },
      }),
      await user.client.request(`/users/${randomUUID()}`, { method: 'DELETE' }),
      await user.client.request('/dashboard/admin'),
    ];

    for (const result of requests) {
      expect(result.status).toBe(403);
    }
  });

  it('mengembalikan 404 saat User mengakses resource milik pengguna lain', async () => {
    const owner = await createTestUser('pemilik');
    const intruder = await createTestUser('penyusup');

    const workLog = await expectStatus(
      await owner.client.request('/work-logs', {
        method: 'POST',
        json: {
          name: 'Kegiatan Pemilik',
          description: 'Uraian kegiatan',
          output: 'Dokumen',
          category: 'PELAKSANAAN_TUGAS',
        },
      }),
      201,
    );
    const workLogId = (workLog.body as { data: { workLog: { id: string } } }).data.workLog.id;

    const note = await expectStatus(
      await owner.client.request('/notes', {
        method: 'POST',
        json: { content: 'Catatan pemilik' },
      }),
      201,
    );
    const noteId = (note.body as { data: { note: { id: string } } }).data.note.id;

    const schedule = await expectStatus(
      await owner.client.request('/schedules', {
        method: 'POST',
        json: {
          title: 'Agenda pemilik',
          startAt: '2026-11-20T09:00:00+08:00',
        },
      }),
      201,
    );
    const scheduleId = (schedule.body as { data: { schedule: { id: string } } }).data.schedule.id;

    const folder = await expectStatus(
      await owner.client.request('/archive/folders', {
        method: 'POST',
        json: { name: 'Folder Pemilik' },
      }),
      201,
    );
    const folderId = (folder.body as { data: { folder: { id: string } } }).data.folder.id;

    const attempts = [
      await intruder.client.request(`/work-logs/${workLogId}`),
      await intruder.client.request(`/work-logs/${workLogId}`, {
        method: 'PATCH',
        json: { name: 'Diubah penyusup' },
      }),
      await intruder.client.request(`/work-logs/${workLogId}`, { method: 'DELETE' }),
      await intruder.client.request(`/notes/${noteId}`, {
        method: 'PATCH',
        json: { content: 'Diubah penyusup' },
      }),
      await intruder.client.request(`/notes/${noteId}`, { method: 'DELETE' }),
      await intruder.client.request(`/schedules/${scheduleId}`),
      await intruder.client.request(`/schedules/${scheduleId}`, { method: 'DELETE' }),
      await intruder.client.request(`/archive/folders/${folderId}`, { method: 'DELETE' }),
    ];

    for (const result of attempts) {
      expect(result.status).toBe(404);
      expect((result.body as { error: { code: string } }).error.code).toBe('NOT_FOUND');
    }

    // Resource tetap utuh untuk pemiliknya.
    await expectStatus(await owner.client.request(`/work-logs/${workLogId}`), 200);
    await expectStatus(await owner.client.request(`/schedules/${scheduleId}`), 200);
  });

  it('halaman bukti dukung publik tidak memerlukan sesi', async () => {
    const guest = new ApiClient(baseUrl);
    const result = await guest.request(`/public/work-logs/${randomUUID()}`);

    expect(result.status).toBe(404);
    expect((result.body as { error: { code: string } }).error.code).toBe('NOT_FOUND');
  });
});
