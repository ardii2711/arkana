'use client';

import { Loader2Icon, TriangleAlertIcon } from 'lucide-react';

import { AdminDashboard } from './admin-dashboard';
import { UserDashboard } from './user-dashboard';
import { useSession } from '@/features/auth/use-auth';
import { getErrorMessage } from '@/lib/api-error';

export function DashboardView() {
  const session = useSession();

  if (session.isPending) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
        Memuat dashboard…
      </div>
    );
  }

  if (session.isError || !session.data) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <TriangleAlertIcon aria-hidden="true" className="size-4" />
        {session.isError ? getErrorMessage(session.error) : 'Tidak dapat memuat sesi.'}
      </div>
    );
  }

  return session.data.role === 'ADMIN' ? <AdminDashboard /> : <UserDashboard />;
}
