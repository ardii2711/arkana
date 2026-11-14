import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';

import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!connectionString) {
  throw new Error('DIRECT_URL atau DATABASE_URL wajib diisi');
}

if (!email || !password) {
  throw new Error('ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi');
}

if (password.length < 8) {
  throw new Error('ADMIN_PASSWORD minimal 8 karakter');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main(): Promise<void> {
  const otherAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN', email: { not: email } },
  });

  if (otherAdmin) {
    throw new Error(`Akun Admin sudah ada (${otherAdmin.email}). Hanya satu Admin yang diizinkan.`);
  }

  const passwordHash = await argon2.hash(password as string, { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email: email as string },
    create: {
      email: email as string,
      name: 'Administrator',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      activatedAt: new Date(),
    },
    update: {
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`Admin siap: ${admin.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
