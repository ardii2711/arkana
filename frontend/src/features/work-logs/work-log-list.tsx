'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  PlusIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { WORK_CATEGORY_LABELS } from './work-log.api';
import {
  EMPTY_WORK_LOG_FILTERS,
  WorkLogFilterBar,
  type WorkLogFilters,
} from './work-log-filter-bar';
import { WorkLogFormDialog } from './work-log-form-dialog';
import { formatActivityDate } from './work-log.format';
import { useWorkLogs } from './use-work-logs';

const PAGE_SIZE = 20;

export function WorkLogList() {
  const [filters, setFilters] = useState<WorkLogFilters>(EMPTY_WORK_LOG_FILTERS);
  const [searchDraft, setSearchDraft] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const query = useWorkLogs({
    page,
    limit: PAGE_SIZE,
    category: filters.category === 'ALL' ? undefined : filters.category,
    from: filters.from,
    to: filters.to,
    search: filters.search,
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, total);
  const hasFilters =
    filters.search !== '' || filters.category !== 'ALL' || filters.from !== '' || filters.to !== '';

  function changeFilters(patch: Partial<WorkLogFilters>) {
    setFilters((previous) => ({ ...previous, ...patch }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(EMPTY_WORK_LOG_FILTERS);
    setSearchDraft('');
    setPage(1);
  }

  function openForm() {
    setFormOpen(true);
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Kegiatan</h1>
          <p className="text-muted-foreground text-sm">
            Catatan pekerjaan harian beserta bukti dukungnya.
          </p>
        </div>
        <Button onClick={() => openForm()}>
          <PlusIcon />
          Catat kegiatan
        </Button>
      </div>

      <WorkLogFilterBar
        value={filters}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSubmitSearch={() => changeFilters({ search: searchDraft.trim() })}
        onChange={changeFilters}
        onReset={resetFilters}
      />

      {query.isError ? (
        <div className="space-y-3">
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{getErrorMessage(query.error)}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => query.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : query.isPending ? (
        <ul className="divide-y rounded-xl border" aria-busy="true" aria-label="Memuat kegiatan">
          {[0, 1, 2, 3].map((row) => (
            <li key={row} className="space-y-2 p-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </li>
          ))}
        </ul>
      ) : total === 0 ? (
        <Card className="border border-dashed ring-0">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
              <ClipboardListIcon aria-hidden="true" className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                {hasFilters ? 'Tidak ada kegiatan yang cocok' : 'Belum ada kegiatan'}
              </p>
              <p className="text-muted-foreground max-w-sm text-sm">
                {hasFilters
                  ? 'Ubah atau reset filter untuk melihat kegiatan lain.'
                  : 'Kegiatan yang Anda catat akan tampil di sini.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="divide-y rounded-xl border">
            {query.data.items.map((workLog) => (
              <li key={workLog.id}>
                <Link
                  href={`/kegiatan/${workLog.id}`}
                  className="hover:bg-muted/50 focus-visible:bg-muted/50 flex flex-col gap-2 p-4 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{workLog.name}</span>
                      <Badge variant="secondary">{WORK_CATEGORY_LABELS[workLog.category]}</Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {workLog.description}
                    </p>
                  </div>
                  <time
                    dateTime={workLog.activityDate}
                    className="text-muted-foreground shrink-0 text-xs sm:text-sm"
                  >
                    {formatActivityDate(workLog.activityDate)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Menampilkan {firstItem}–{lastItem} dari {total} kegiatan
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeftIcon />
                Sebelumnya
              </Button>
              <span className="text-muted-foreground text-sm tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || query.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Berikutnya
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </>
      )}

      {formOpen ? <WorkLogFormDialog workLog={null} onOpenChange={setFormOpen} /> : null}
    </div>
  );
}
