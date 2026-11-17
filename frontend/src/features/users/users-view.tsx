'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  TriangleAlertIcon,
  UserRoundXIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { NAME_MAX_LENGTH } from '@/lib/limits';
import { getInitials } from '@/lib/initials';
import { formatDate } from '@/lib/date';
import { useSession } from '@/features/auth/use-auth';
import { USER_STATUS_BADGES, USER_STATUS_LABELS, type AdminAccount } from './users.api';
import { UserEditDialog } from './user-edit-dialog';
import { UserInviteDialog } from './user-invite-dialog';
import { useResendInvitation, useUsers } from './use-users';

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
          <Link href="/">Kembali ke Dashboard</Link>
        </Button>
      </div>
    );
  }

  return <UsersAdmin />;
}

function UsersAdmin() {
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const query = useUsers({ page, limit: PAGE_SIZE, search: search || undefined });
  const resend = useResendInvitation();

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = query.data?.items ?? [];
  const hasFilters = search !== '';

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchDraft.trim());
    setPage(1);
  }

  function resetSearch() {
    setSearch('');
    setSearchDraft('');
    setPage(1);
  }

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

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={submitSearch} className="min-w-48 flex-1 sm:max-w-sm">
          <InputGroup>
            <InputGroupInput
              value={searchDraft}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Cari nama atau email"
              aria-label="Cari nama atau email"
              onChange={(event) => setSearchDraft(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" size="icon-xs" aria-label="Cari akun">
                <SearchIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>

        {hasFilters ? (
          <Button variant="ghost" size="icon" aria-label="Reset pencarian" onClick={resetSearch}>
            <XIcon />
          </Button>
        ) : null}
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
                ? 'Ubah kata kunci pencarian.'
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
                        <Avatar className="size-9">
                          <AvatarFallback className="text-xs">
                            {getInitials(account.name)}
                          </AvatarFallback>
                        </Avatar>
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
                      <div className="flex justify-end gap-1.5">
                        {account.role !== 'ADMIN' ? (
                          <>
                            {account.status === 'INVITED' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={resendingId === account.id}
                                onClick={() => onResend(account.id)}
                              >
                                {resendingId === account.id ? (
                                  <Loader2Icon aria-hidden="true" className="animate-spin" />
                                ) : (
                                  <SendIcon aria-hidden="true" />
                                )}
                                Kirim ulang
                              </Button>
                            ) : null}
                            <Button variant="outline" size="sm" onClick={() => setEditing(account)}>
                              <PencilIcon aria-hidden="true" />
                              Ubah
                            </Button>
                          </>
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
                    <Avatar className="size-10">
                      <AvatarFallback className="text-xs">
                        {getInitials(account.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <p className="flex items-center gap-2 font-medium">
                          <span className="truncate">{account.name}</span>
                          {account.role === 'ADMIN' ? <Badge variant="outline">Admin</Badge> : null}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">{account.email}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={USER_STATUS_BADGES[account.status]}>
                          {USER_STATUS_LABELS[account.status]}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          Terdaftar {formatDate(account.createdAt)}
                        </span>
                      </div>
                      {account.role !== 'ADMIN' ? (
                        <div className="flex flex-wrap gap-1.5">
                          {account.status === 'INVITED' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={resendingId === account.id}
                              onClick={() => onResend(account.id)}
                            >
                              {resendingId === account.id ? (
                                <Loader2Icon aria-hidden="true" className="animate-spin" />
                              ) : (
                                <SendIcon aria-hidden="true" />
                              )}
                              Kirim ulang
                            </Button>
                          ) : null}
                          <Button variant="outline" size="sm" onClick={() => setEditing(account)}>
                            <PencilIcon aria-hidden="true" />
                            Ubah
                          </Button>
                        </div>
                      ) : null}
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
