'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/date';
import { WORK_CATEGORY_LABELS } from '@/lib/work-category';
import { WorkLogEvidenceBadge } from './work-log-evidence-badge';
import {
  parseWorkLogFilters,
  parseWorkLogPage,
  toWorkLogParams,
  toWorkLogSearch,
  WORK_LOG_PAGE_SIZE,
  WORK_LOG_PERIOD_LABELS,
  WORK_LOG_PERIODS,
  WorkLogFilterBar,
  type WorkLogFilters,
} from './work-log-filter-bar';
import { WorkLogFormDialog } from './work-log-form-dialog';
import { useWorkLogs } from './use-work-logs';

const SEARCH_DEBOUNCE_MS = 300;

function emptyState(filters: WorkLogFilters) {
  if (filters.search) {
    return {
      title: 'Tidak ada kegiatan yang cocok',
      description: `Tidak ada nama atau uraian kegiatan yang memuat "${filters.search}".`,
    };
  }

  if (filters.period === 'today') {
    return {
      title: 'Belum ada kegiatan hari ini',
      description: 'Catat kegiatan hari ini, atau lihat periode lain di bawah ini.',
    };
  }

  return {
    title: 'Belum ada kegiatan pada periode ini',
    description: 'Kegiatan yang Anda catat akan tampil di sini.',
  };
}

export function WorkLogList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseWorkLogFilters(searchParams);
  const page = parseWorkLogPage(searchParams);
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [formOpen, setFormOpen] = useState(false);
  const searchTimer = useRef<number | undefined>(undefined);

  const query = useWorkLogs(toWorkLogParams(filters, page));

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / WORK_LOG_PAGE_SIZE));
  const firstItem = total === 0 ? 0 : (page - 1) * WORK_LOG_PAGE_SIZE + 1;
  const lastItem = Math.min(page * WORK_LOG_PAGE_SIZE, total);
  const state = emptyState(filters);
  const otherPeriods = WORK_LOG_PERIODS.filter((period) => period !== filters.period);

  function navigate(nextFilters: WorkLogFilters, nextPage = 1) {
    router.replace(toWorkLogSearch(nextFilters, nextPage), { scroll: false });
  }

  function changePeriod(period: WorkLogFilters['period']) {
    navigate({ ...filters, period });
  }

  function changeSearch(value: string) {
    setSearchDraft(value);
    window.clearTimeout(searchTimer.current);

    if (value.trim() === filters.search) return;

    if (value.trim() === '') {
      navigate({ ...filters, search: '' });
      return;
    }

    searchTimer.current = window.setTimeout(() => {
      navigate({ ...filters, search: value.trim() });
    }, SEARCH_DEBOUNCE_MS);
  }

  function resetSearch() {
    setSearchDraft('');
    navigate({ ...filters, search: '' });
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
        <Button onClick={() => setFormOpen(true)}>
          <PlusIcon />
          Catat kegiatan
        </Button>
      </div>

      <WorkLogFilterBar
        value={filters}
        searchValue={searchDraft}
        onSearchChange={changeSearch}
        onPeriodChange={changePeriod}
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
        <ul
          className="divide-y overflow-hidden rounded-xl border"
          aria-busy="true"
          aria-label="Memuat kegiatan"
        >
          {[0, 1, 2, 3].map((row) => (
            <li key={row} className="flex flex-col gap-2 p-4 sm:flex-row sm:gap-4">
              <Skeleton className="h-3 w-24" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-5 w-24" />
            </li>
          ))}
        </ul>
      ) : total === 0 ? (
        <Card className="border border-dashed ring-0">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
              {filters.search ? (
                <SearchIcon aria-hidden="true" className="size-5" />
              ) : (
                <ClipboardListIcon aria-hidden="true" className="size-5" />
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium">{state.title}</p>
              <p className="text-muted-foreground max-w-sm text-sm">{state.description}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => setFormOpen(true)}>
                <PlusIcon />
                Catat kegiatan
              </Button>
              {filters.search ? (
                <Button variant="outline" onClick={resetSearch}>
                  Hapus pencarian
                </Button>
              ) : (
                otherPeriods.map((period) => (
                  <Button key={period} variant="outline" onClick={() => changePeriod(period)}>
                    Lihat {WORK_LOG_PERIOD_LABELS[period].toLowerCase()}
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="divide-y overflow-hidden rounded-xl border">
            {query.data.items.map((workLog) => (
              <li key={workLog.id}>
                <Link
                  href={`/kegiatan/${workLog.id}`}
                  className="hover:bg-muted/50 focus-visible:bg-muted/50 flex flex-col gap-2 p-4 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:flex-row sm:items-start sm:gap-4"
                >
                  <time
                    dateTime={workLog.activityDate}
                    className="text-muted-foreground text-xs font-medium tabular-nums sm:w-28 sm:shrink-0 sm:pt-0.5 sm:text-sm"
                  >
                    {formatDate(workLog.activityDate)}
                  </time>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium">{workLog.name}</p>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {workLog.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-col sm:items-end">
                    <Badge variant="secondary">{WORK_CATEGORY_LABELS[workLog.category]}</Badge>
                    <WorkLogEvidenceBadge fileCount={workLog.fileCount} />
                  </div>
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
                onClick={() => navigate(filters, page - 1)}
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
                onClick={() => navigate(filters, page + 1)}
              >
                Berikutnya
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </>
      )}

      {formOpen ? (
        <WorkLogFormDialog
          workLog={null}
          onOpenChange={setFormOpen}
          onCreated={() => {
            setSearchDraft('');
            navigate({ ...filters, search: '' });
          }}
        />
      ) : null}
    </div>
  );
}
