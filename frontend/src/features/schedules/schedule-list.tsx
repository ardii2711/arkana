'use client';

import {
  BanIcon,
  CalendarPlusIcon,
  CheckIcon,
  EllipsisIcon,
  MapPinIcon,
  PencilIcon,
  RotateCcwIcon,
  SearchXIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { SCHEDULE_STATUS_BADGES, SCHEDULE_STATUS_LABELS, type Schedule } from './schedule.api';
import { scheduleTimeLabel } from './schedule.format';
import { useDeleteSchedule, useUpdateScheduleStatus } from './use-schedules';

type ScheduleListProps = {
  schedules: Schedule[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  hasSearch: boolean;
  showDate?: boolean;
  emptyText?: string;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (schedule: Schedule) => void;
  onClearSearch: () => void;
};

export function ScheduleList({
  schedules,
  isLoading,
  isError,
  error,
  hasSearch,
  showDate = false,
  emptyText,
  onRetry,
  onAdd,
  onEdit,
  onClearSearch,
}: ScheduleListProps) {
  const [deleting, setDeleting] = useState<Schedule | null>(null);
  const remove = useDeleteSchedule();
  const updateStatus = useUpdateScheduleStatus();

  function changeStatus(schedule: Schedule, status: Schedule['status']) {
    updateStatus.mutate(
      { id: schedule.id, status },
      {
        onSuccess: () => toast.success(`Status diubah menjadi ${SCHEDULE_STATUS_LABELS[status]}.`),
        onError: (mutationError) => toast.error(getErrorMessage(mutationError)),
      },
    );
  }

  function handleDelete() {
    if (!deleting) return;

    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Agenda dihapus.');
        setDeleting(null);
      },
      onError: (mutationError) => toast.error(getErrorMessage(mutationError)),
    });
  }

  return (
    <div className="space-y-4">
      {isError ? (
        <div className="space-y-3">
          <Alert variant="destructive">
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={onRetry}>
            Coba lagi
          </Button>
        </div>
      ) : isLoading ? (
        <ul className="divide-y overflow-hidden rounded-xl border" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <li key={row} className="flex flex-col gap-2 p-4 sm:flex-row sm:gap-4">
              <Skeleton className="h-4 w-28" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </li>
          ))}
        </ul>
      ) : schedules.length === 0 && emptyText ? (
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      ) : schedules.length === 0 ? (
        <Card className="border border-dashed ring-0">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
              {hasSearch ? (
                <SearchXIcon aria-hidden="true" className="size-5" />
              ) : (
                <CalendarPlusIcon aria-hidden="true" className="size-5" />
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                {hasSearch ? 'Tidak ada agenda yang cocok' : 'Belum ada agenda'}
              </p>
              <p className="text-muted-foreground max-w-sm text-sm">
                {hasSearch
                  ? 'Tidak ada judul, deskripsi, atau tempat yang memuat kata kunci tersebut.'
                  : 'Tambahkan agenda untuk mengisi jadwal Anda.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {hasSearch ? (
                <Button variant="outline" onClick={onClearSearch}>
                  Hapus pencarian
                </Button>
              ) : (
                <Button onClick={onAdd}>
                  <CalendarPlusIcon />
                  Tambah agenda
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {schedules.map((schedule) => (
            <li
              key={schedule.id}
              className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:gap-4"
            >
              <span className="text-muted-foreground text-xs font-medium tabular-nums sm:w-32 sm:shrink-0 sm:pt-0.5 sm:text-sm">
                {showDate ? `${formatDate(schedule.startAt)} · ` : ''}
                {scheduleTimeLabel(schedule)}
              </span>

              <div className="flex min-w-0 flex-1 items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        schedule.status === 'CANCELLED' && 'text-muted-foreground line-through',
                        schedule.status === 'DONE' && 'text-muted-foreground',
                      )}
                    >
                      {schedule.title}
                    </p>
                    {schedule.status === 'NOT_STARTED' ? null : (
                      <Badge variant={SCHEDULE_STATUS_BADGES[schedule.status]}>
                        {SCHEDULE_STATUS_LABELS[schedule.status]}
                      </Badge>
                    )}
                  </div>
                  {schedule.location ? (
                    <p className="text-muted-foreground inline-flex items-center gap-1 text-sm">
                      <MapPinIcon aria-hidden="true" className="size-3.5" />
                      {schedule.location}
                    </p>
                  ) : null}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mt-1 shrink-0"
                      aria-label={`Aksi untuk ${schedule.title}`}
                    >
                      <EllipsisIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {schedule.status !== 'DONE' ? (
                      <DropdownMenuItem
                        disabled={updateStatus.isPending}
                        onSelect={() => changeStatus(schedule, 'DONE')}
                      >
                        <CheckIcon aria-hidden="true" />
                        Tandai selesai
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        disabled={updateStatus.isPending}
                        onSelect={() => changeStatus(schedule, 'NOT_STARTED')}
                      >
                        <RotateCcwIcon aria-hidden="true" />
                        Tandai belum dimulai
                      </DropdownMenuItem>
                    )}
                    {schedule.status !== 'CANCELLED' ? (
                      <DropdownMenuItem
                        disabled={updateStatus.isPending}
                        onSelect={() => changeStatus(schedule, 'CANCELLED')}
                      >
                        <BanIcon aria-hidden="true" />
                        Batalkan agenda
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => onEdit(schedule)}>
                      <PencilIcon aria-hidden="true" />
                      Ubah
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(schedule)}>
                      <Trash2Icon aria-hidden="true" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus agenda?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleting?.title}&quot; akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={remove.isPending} onClick={handleDelete}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
