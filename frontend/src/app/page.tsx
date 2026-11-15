'use client';

import { LogOutIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogout, useSession } from '@/features/auth/use-auth';

export default function HomePage() {
  const router = useRouter();
  const session = useSession();
  const logout = useLogout();

  useEffect(() => {
    if (session.data === null) router.replace('/login');
  }, [session.data, router]);

  if (session.isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Memuat sesi…</p>
      </main>
    );
  }

  if (session.isError) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Alert variant="destructive">
            <AlertDescription>Tidak dapat memuat sesi. Periksa koneksi Anda.</AlertDescription>
          </Alert>
          <Button className="w-full" onClick={() => session.refetch()}>
            Coba lagi
          </Button>
        </div>
      </main>
    );
  }

  if (!session.data) return null;

  return (
    <main className="bg-muted/30 flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-sm [--card-spacing:1.5rem]">
        <CardHeader>
          <div className="bg-primary text-primary-foreground font-heading mb-2 flex size-11 items-center justify-center rounded-xl text-lg font-semibold">
            A
          </div>
          <CardTitle className="text-lg">Halo, {session.data.name}</CardTitle>
          <CardDescription>
            {session.data.email} · {session.data.role === 'ADMIN' ? 'Admin' : 'User'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOutIcon aria-hidden="true" />
            {logout.isPending ? 'Keluar…' : 'Keluar'}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
