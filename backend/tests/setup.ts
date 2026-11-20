import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { afterAll } from 'vitest';

const envPath = fileURLToPath(new URL('../.env.test', import.meta.url));

if (!existsSync(envPath)) {
  throw new Error(
    'backend/.env.test tidak ditemukan. Salin backend/.env.test.example menjadi backend/.env.test lalu isi nilainya.',
  );
}

process.loadEnvFile(envPath);
process.env.NODE_ENV = 'test';
// Log request tidak membantu saat test; bisa diubah sementara bila perlu debugging.
process.env.LOG_LEVEL = 'silent';

const required = [
  'TEST_DATABASE_URL',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
  'JWT_ACCESS_SECRET',
  'MAILPIT_URL',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Variabel backend/.env.test belum diisi: ${missing.join(', ')}`);
}

if (process.env.ALLOW_SHARED_DB_TESTS !== '1') {
  throw new Error(
    'Test menulis dan menghapus data pada database aplikasi. Set ALLOW_SHARED_DB_TESTS=1 di backend/.env.test untuk mengizinkannya.',
  );
}

// Aplikasi membaca DATABASE_URL; test memakai TEST_DATABASE_URL agar jelas asal datanya.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

afterAll(async () => {
  const { prisma } = await import('../src/lib/prisma');

  await prisma.$disconnect();
});
