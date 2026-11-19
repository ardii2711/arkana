'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/use-auth';

export function PublicSessionCta({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const session = useSession();

  if (session.isPending) {
    return (
      <Button size={size} disabled>
        Memuat…
      </Button>
    );
  }

  return session.data ? (
    <Button asChild size={size}>
      <Link href="/dashboard">Buka Dashboard</Link>
    </Button>
  ) : (
    <Button asChild size={size}>
      <Link href="/login">Masuk</Link>
    </Button>
  );
}
