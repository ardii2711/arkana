'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  PlusIcon,
  TriangleAlertIcon,
  UserRoundXIcon,
  UsersIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/date';
import { NAME_MAX_LENGTH } from '@/lib/limits';
import { useSession } from '@/features/auth/use-auth';
import { AccountActions } from './account-actions';
import { AccountAvatar } from './account-avatar';
import {
  USER_STATUS_BADGES,
  USER_STATUS_LABELS,
  type AdminAccount,
  type UserStatus,
} from './users.api';
import { UserEditDialog } from './user-edit-dialog';
import { UserInviteDialog } from './user-invite-dialog';
import { useUsers } from './use-users';

const PAGE_SIZE = 20;

export function UsersView() {
  const session = useSession();

  if (session.isPending) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
        Memuat akun…
      </div>
    );
  }

  if (session.data?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <UserRoundXIcon className="text-muted-foreground size-10" />
        <h1 className="font-heading text-xl font-semibold">Akses ditolak</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          Halaman ini hanya dapat diakses oleh Admin ARKANA.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </div>
    );
  }

  return <UsersAdmin />;
}

function UsersAdmin() {
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAccount | null>(null);

  useEffect(() => {
    const next = searchDraft.trim();

    if (next === search) return;

    const timer = setTimeout(() => {
      setSearch(next);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchDraft, search]);

  const query = useUsers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = query.data?.items ?? [];
  const hasFilters = search !== '' || status !== 'ALL';

  function onStatusChange(value: string) {
    setStatus(value as UserStatus | 'ALL');
    setPage(1);
  }

  function onDeleted() {
    if (items.length === 1 && page > 1) {
      setPage((value) => value - 1);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Akun</h1>
          <p className="text-muted-foreground text-sm">
            Kelola akun pengguna, undangan, dan status akses.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <PlusIcon aria-hidden="true" />
          Undang pengguna
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={searchDraft}
          maxLength={NAME_MAX_LENGTH}
          placeholder="Cari nama atau email"
          aria-label="Cari nama atau email"
          className="sm:max-w-sm"
          onChange={(event) => setSearchDraft(event.target.value)}
        />
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter status akun">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua status</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INVITED">Diundang</SelectItem>
            <SelectItem value="INACTIVE">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : null}

      {query.isError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>
            {getErrorMessage(query.error)}{' '}
            <button type="button" className="underline" onClick={() => query.refetch()}>
              Coba lagi
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!query.isPending && !query.isError && items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <UsersIcon className="text-muted-foreground size-10" />
          <p className="font-medium">
            {page > 1 || hasFilters ? 'Tidak ada akun yang cocok' : 'Belum ada akun'}
          </p>
          <p className="text-muted-foreground text-sm">
            {page > 1
              ? 'Kembali ke halaman sebelumnya.'
              : hasFilters
                ? 'Ubah kata kunci atau status filter.'
                : 'Undang pengguna pertama untuk mulai menggunakan ARKANA.'}
          </p>
          {page > 1 ? (
            <Button variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Halaman sebelumnya
            </Button>
          ) : null}
        </div>
      ) : null}

      {!query.isPending && !query.isError && items.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-left">
                  <th className="px-3 py-2 font-medium">Pengguna</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Terdaftar</th>
                  <th className="px-3 py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((account) => (
                  <tr key={account.id} className="align-middle">
                    <td className="border-t px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <AccountAvatar account={account} className="size-9" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium">
                            <span className="truncate">{account.name}</span>
                            {account.role === 'ADMIN' ? (
                              <Badge variant="outline">Admin</Badge>
                            ) : null}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">{account.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border-t px-3 py-2.5">
                      <Badge variant={USER_STATUS_BADGES[account.status]}>
                        {USER_STATUS_LABELS[account.status]}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground border-t px-3 py-2.5 whitespace-nowrap">
                      {formatDate(account.createdAt)}
                    </td>
                    <td className="border-t px-3 py-2.5">
                      <div className="flex justify-end">
                        {account.role !== 'ADMIN' ? (
                          <AccountActions
                            account={account}
                            onEdit={() => setEditing(account)}
                            onDeleted={onDeleted}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((account) => (
              <li key={account.id}>
                <Card>
                  <CardContent className="flex items-start gap-3 p-4">
                    <AccountAvatar account={account} className="size-10" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium">
                            <span className="truncate">{account.name}</span>
                            {account.role === 'ADMIN' ? (
                              <Badge variant="outline">Admin</Badge>
                            ) : null}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">{account.email}</p>
                        </div>
                        {account.role !== 'ADMIN' ? (
                          <AccountActions
                            account={account}
                            onEdit={() => setEditing(account)}
                            onDeleted={onDeleted}
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={USER_STATUS_BADGES[account.status]}>
                          {USER_STATUS_LABELS[account.status]}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          Terdaftar {formatDate(account.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            Halaman {page} dari {totalPages} · {total} akun
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Halaman sebelumnya"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Halaman berikutnya"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      ) : null}

      {inviteOpen ? <UserInviteDialog onOpenChange={setInviteOpen} /> : null}
      {editing ? (
        <UserEditDialog account={editing} onOpenChange={(open) => !open && setEditing(null)} />
      ) : null}
    </div>
  );
}
