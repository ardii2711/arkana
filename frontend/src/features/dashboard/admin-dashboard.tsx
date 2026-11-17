'use client';

import {
  ChevronRightIcon,
  Loader2Icon,
  MailCheckIcon,
  SendIcon,
  TriangleAlertIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { getInitials } from '@/lib/initials';
import { formatDate } from '@/lib/date';
import { useAdminDashboard } from './use-dashboard';
import { useResendInvitation } from '@/features/users/use-users';

export function AdminDashboard() {
  const query = useAdminDashboard();
  const resend = useResendInvitation();
  const [resendingId, setResendingId] = useState<string | null>(null);

  if (query.isPending) {
    return (
      <div className="w-full space-y-6">
        <AdminHeader />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="w-full space-y-6">
        <AdminHeader />
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>
            {query.isError ? getErrorMessage(query.error) : 'Data dashboard kosong.'}{' '}
            <button type="button" className="underline" onClick={() => query.refetch()}>
              Coba lagi
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { accounts, pendingInvitations } = query.data;

  function onResend(id: string) {
    setResendingId(id);
    resend.mutate(id, {
      onSuccess: () => toast.success('Undangan dikirim ulang.'),
      onError: (error) => toast.error(getErrorMessage(error)),
      onSettled: () => setResendingId(null),
    });
  }

  return (
    <div className="w-full space-y-6">
      <AdminHeader />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={
            <UserRoundCheckIcon
              aria-hidden="true"
              className="size-5 text-emerald-600 dark:text-emerald-400"
            />
          }
          label="Akun aktif"
          value={accounts.active}
        />
        <StatCard
          icon={
            <MailCheckIcon
              aria-hidden="true"
              className="size-5 text-amber-600 dark:text-amber-400"
            />
          }
          label="Akun diundang"
          value={accounts.invited}
        />
        <StatCard
          icon={<UserRoundXIcon aria-hidden="true" className="size-5 text-muted-foreground" />}
          label="Akun nonaktif"
          value={accounts.inactive}
        />
      </div>

      <Card aria-labelledby="pending-invitations-title">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <CardTitle id="pending-invitations-title" className="text-base">
                Undangan belum diterima
              </CardTitle>
              <span className="text-muted-foreground text-xs tabular-nums">
                {pendingInvitations.length} akun
              </span>
            </div>
            <Button variant="ghost" size="sm" asChild className="-mr-2">
              <Link href="/akun">
                Kelola akun
                <ChevronRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Semua undangan sudah diterima.
            </p>
          ) : (
            <ul className="divide-y">
              {pendingInvitations.map((invitation) => (
                <li key={invitation.id} className="flex items-center gap-3 py-2.5">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">
                      {getInitials(invitation.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{invitation.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {invitation.email} · diundang {formatDate(invitation.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={resendingId === invitation.id}
                    onClick={() => onResend(invitation.id)}
                  >
                    {resendingId === invitation.id ? (
                      <Loader2Icon aria-hidden="true" className="animate-spin" />
                    ) : (
                      <SendIcon aria-hidden="true" />
                    )}
                    Kirim ulang
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminHeader() {
  return (
    <div className="space-y-1">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground text-sm">
        Ringkasan akun pengguna dan undangan yang belum diterima.
      </p>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex h-full items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
