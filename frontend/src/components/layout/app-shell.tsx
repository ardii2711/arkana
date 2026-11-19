'use client';

import { Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { BrandLogo } from '@/components/shared/brand-logo';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSession } from '@/features/auth/use-auth';
import { getErrorMessage } from '@/lib/api-error';

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
            <AlertDescription>{getErrorMessage(session.error)}</AlertDescription>
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
          <AppHeader />
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function AppHeader() {
  const { isMobile, state } = useSidebar();
  const showTrigger = isMobile || state === 'expanded';

  return (
    <header className="bg-background/80 sticky top-0 z-10 flex h-15 shrink-0 items-center gap-2 border-b px-4 backdrop-blur md:px-6">
      {showTrigger ? (
        <SidebarTrigger />
      ) : (
        <Link href="/dashboard" aria-label="ARKANA — Dashboard">
          <BrandLogo variant="wordmarkOnly" className="h-3.5 w-auto" />
        </Link>
      )}
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
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
