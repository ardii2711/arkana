import { randomUUID } from 'node:crypto';

import argon2 from 'argon2';

import { prisma } from '../../src/lib/prisma';
import { ApiClient, expectStatus } from './client';
import { startServer } from './server';

export const TEST_EMAIL_DOMAIN = 'e2e.arkana.test';
export const TEST_PASSWORD = 'arkana-test-1234';
export const ADMIN_EMAIL = `admin@${TEST_EMAIL_DOMAIN}`;

export interface TestUser {
  id: string;
  email: string;
  password: string;
  client: ApiClient;
}

let cachedHash: string | null = null;

async function testPasswordHash(): Promise<string> {
  cachedHash ??= await argon2.hash(TEST_PASSWORD, { type: argon2.argon2id });

  return cachedHash;
}

/** Akun Admin khusus uji; dibuat sekali, dipakai untuk pembersihan lewat API. */
export async function ensureAdmin(): Promise<TestUser> {
  const passwordHash = await testPasswordHash();

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, role: 'ADMIN', status: 'ACTIVE' },
    create: {
      name: 'Admin Uji',
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      activatedAt: new Date(),
    },
  });

  const client = await loginAs(admin.email);

  return { id: admin.id, email: admin.email, password: TEST_PASSWORD, client };
}

export async function loginAs(email: string, password = TEST_PASSWORD): Promise<ApiClient> {
  const client = new ApiClient(await startServer());
  const result = await expectStatus(
    await client.request('/auth/login', { json: { email, password } }),
    200,
  );

  if (!(result.body as { data?: { user?: { email?: string } } }).data?.user) {
    throw new Error(`Login ${email} tidak mengembalikan user`);
  }

  return client;
}

/** Akun User uji aktif beserta klien yang sudah login. */
export async function createTestUser(label: string): Promise<TestUser> {
  const email = `e2e.${label}.${randomUUID().slice(0, 8)}@${TEST_EMAIL_DOMAIN}`;
  const passwordHash = await testPasswordHash();

  const user = await prisma.user.create({
    data: {
      name: `User Uji ${label}`,
      email,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      activatedAt: new Date(),
    },
  });

  const client = await loginAs(user.email);

  return { id: user.id, email: user.email, password: TEST_PASSWORD, client };
}

/** Menghapus seluruh akun uji lewat endpoint Admin agar objek R2 ikut dibersihkan. */
export async function cleanupTestUsers(): Promise<void> {
  const admin = await ensureAdmin();
  const listed = await expectStatus(
    await admin.client.request(`/users?search=${encodeURIComponent(TEST_EMAIL_DOMAIN)}&limit=100`),
    200,
  );

  const items = (listed.body as { data: { items: { id: string; role: string }[] } }).data.items;

  for (const item of items) {
    if (item.role === 'USER') {
      await expectStatus(
        await admin.client.request(`/users/${item.id}`, { method: 'DELETE' }),
        204,
      );
    }
  }
}
