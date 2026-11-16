'use client';

import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import {
  SCHEDULE_CATEGORY_LABELS,
  SCHEDULE_STATUS_BADGES,
  SCHEDULE_STATUS_LABELS,
  type Schedule,
} from './schedule.api';
import { scheduleDateLabel, witaShortDate } from './schedule.format';
import { useDeleteSchedule } from './use-schedules';

type ScheduleListProps = {
  title: string;
  subtitle: string;
  schedules: Schedule[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  showDate?: boolean;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (schedule: Schedule) => void;
};

export function ScheduleList({
  title,
  subtitle,
  schedules,
  isLoading,
  isError,
  error,
  showDate = false,
  onRetry,
  onAdd,
  onEdit,
}: ScheduleListProps) {
  const remove = useDeleteSchedule();

  return (
    <section aria-labelledby="schedule-list-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="schedule-list-title" className="font-heading text-lg font-semibold">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm">
            {schedules.length} agenda · {subtitle}
          </p>
        </div>
        <Button onClick={onAdd}>
          <PlusIcon />
          Tambah agenda
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(error)}{' '}
            <button type="button" className="underline" onClick={onRetry}>
              Coba lagi
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!isLoading && !isError && schedules.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <CalendarIcon className="text-muted-foreground size-8" />
          <p className="font-medium">Belum ada agenda</p>
          <p className="text-muted-foreground text-sm">Tambahkan agenda baru untuk rentang ini.</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <ClockIcon className="size-3.5" />
                    {showDate ? `${witaShortDate(schedule.startAt)} · ` : ''}
                    {scheduleDateLabel(schedule)}
                  </span>
                  <Badge variant="secondary">{SCHEDULE_CATEGORY_LABELS[schedule.category]}</Badge>
                  <Badge variant={SCHEDULE_STATUS_BADGES[schedule.status]}>
                    {SCHEDULE_STATUS_LABELS[schedule.status]}
                  </Badge>
                </div>
                <p className="font-medium">{schedule.title}</p>
                {schedule.location ? (
                  <p className="text-muted-foreground inline-flex items-center gap-1 text-sm">
                    <MapPinIcon className="size-3.5" />
                    {schedule.location}
                  </p>
                ) : null}
                {schedule.description ? (
                  <p className="text-muted-foreground text-sm break-words">
                    {schedule.description}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ubah agenda"
                  onClick={() => onEdit(schedule)}
                >
                  <PencilIcon />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Hapus agenda">
                      <Trash2Icon />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus agenda?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &quot;{schedule.title}&quot; akan dihapus permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(schedule.id)}
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
