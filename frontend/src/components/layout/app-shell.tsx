'use client';

import { Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSession } from '@/features/auth/use-auth';

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.data === null) router.replace('/login');
  }, [session.data, router]);

  if (session.isPending) {
    return <SessionLoading label="Memuat sesi…" />;
  }

  if (session.isError) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>Tidak dapat memuat sesi. Periksa koneksi Anda.</AlertDescription>
          </Alert>
          <Button className="w-full" onClick={() => session.refetch()}>
            Coba lagi
          </Button>
        </div>
      </main>
    );
  }

  if (!session.data) {
    return <SessionLoading label="Mengalihkan…" />;
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar user={session.data} />
        <SidebarInset className="min-w-0">
          <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center border-b px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function SessionLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
        {label}
      </p>
    </main>
  );
}
