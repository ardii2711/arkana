'use client';

import {
  ArchiveIcon,
  CalendarCheck2Icon,
  CalendarPlusIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  NotebookPenIcon,
  PaperclipIcon,
  PinIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { formatFileSize } from '@/lib/file-format';
import {
  SCHEDULE_STATUS_BADGES,
  SCHEDULE_STATUS_LABELS,
  type Schedule,
} from '@/features/schedules/schedule.api';
import { formatDate, formatMonthYear } from '@/lib/date';
import { scheduleDateLabel } from '@/features/schedules/schedule.format';
import { useUserDashboard } from './use-dashboard';

export function UserDashboard() {
  const query = useUserDashboard();

  if (query.isPending) {
    return (
      <div className="w-full space-y-6">
        <DashboardHeader />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
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
        <DashboardHeader />
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

  const { summary, todaySchedules, upcomingSchedules, pinnedNotes } = query.data;

  const archivePercent =
    summary.archive.quotaBytes > 0
      ? Math.min(100, (summary.archive.usedBytes / summary.archive.quotaBytes) * 100)
      : 0;

  return (
    <div className="w-full space-y-6">
      <DashboardHeader />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={<ClipboardListIcon aria-hidden="true" className="text-muted-foreground size-5" />}
          label="Kegiatan bulan ini"
          value={String(summary.monthWorkLogs)}
          hint={formatMonthYear(new Date())}
        />
        <StatCard
          icon={<CalendarCheck2Icon aria-hidden="true" className="text-muted-foreground size-5" />}
          label="Kegiatan 7 hari terakhir"
          value={String(summary.weekWorkLogs)}
        />
        <StatCard
          icon={<PaperclipIcon aria-hidden="true" className="text-muted-foreground size-5" />}
          label="File bukti dukung"
          value={String(summary.evidenceFiles)}
        />
        <Card>
          <CardContent className="flex h-full flex-col justify-center gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">Penyimpanan arsip</p>
              <ArchiveIcon aria-hidden="true" className="text-muted-foreground size-5" />
            </div>
            <p className="text-lg leading-tight font-semibold tabular-nums">
              {formatFileSize(summary.archive.usedBytes)}
              <span className="text-muted-foreground text-sm font-normal">
                {' '}
                / {formatFileSize(summary.archive.quotaBytes)}
              </span>
            </p>
            <Progress value={archivePercent} aria-label="Pemakaian kuota arsip" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ScheduleListCard
          id="today-schedules-title"
          title="Agenda hari ini"
          emptyMessage="Tidak ada agenda hari ini."
          schedules={todaySchedules}
          showDate={false}
        />
        <ScheduleListCard
          id="upcoming-schedules-title"
          title="Agenda terdekat"
          subtitle="5 berikutnya"
          emptyMessage="Tidak ada agenda mendatang."
          schedules={upcomingSchedules}
          showDate
        />
        <Card aria-labelledby="pinned-notes-title">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle id="pinned-notes-title" className="text-base">
                Catatan disematkan
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="-mr-2">
                <Link href="/catatan">
                  Semua
                  <ChevronRightIcon aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pinnedNotes.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Belum ada catatan disematkan.
              </p>
            ) : (
              <ul className="divide-y">
                {pinnedNotes.map((note) => (
                  <li key={note.id} className="py-2.5">
                    <p className="line-clamp-2 text-sm whitespace-pre-line">{note.content}</p>
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                      <PinIcon aria-hidden="true" className="size-3" />
                      Disematkan
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Ringkasan aktivitas dan akses cepat Anda.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/kegiatan">
            <ClipboardListIcon aria-hidden="true" />
            Input kegiatan
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/agenda">
            <CalendarPlusIcon aria-hidden="true" />
            Tambah agenda
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/catatan">
            <NotebookPenIcon aria-hidden="true" />
            Catatan baru
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex h-full items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          {hint ? <p className="text-muted-foreground text-xs capitalize">{hint}</p> : null}
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}

function ScheduleListCard({
  id,
  title,
  subtitle,
  emptyMessage,
  schedules,
  showDate,
}: {
  id: string;
  title: string;
  subtitle?: string;
  emptyMessage: string;
  schedules: Schedule[];
  showDate: boolean;
}) {
  return (
    <Card aria-labelledby={id}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <CardTitle id={id} className="text-base">
              {title}
            </CardTitle>
            {subtitle ? <span className="text-muted-foreground text-xs">{subtitle}</span> : null}
          </div>
          <Button variant="ghost" size="sm" asChild className="-mr-2">
            <Link href="/agenda">
              Semua
              <ChevronRightIcon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{emptyMessage}</p>
        ) : (
          <ul className="divide-y">
            {schedules.map((schedule) => (
              <li key={schedule.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{schedule.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {showDate ? `${formatDate(schedule.startAt)} · ` : ''}
                    {scheduleDateLabel(schedule)}
                    {schedule.location ? ` · ${schedule.location}` : ''}
                  </p>
                </div>
                <Badge variant={SCHEDULE_STATUS_BADGES[schedule.status]} className="shrink-0">
                  {SCHEDULE_STATUS_LABELS[schedule.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
