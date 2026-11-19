'use client';

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import {
  parseReportFilters,
  parseReportPage,
  REPORT_PAGE_SIZE,
  ReportFilterBar,
  toReportParams,
  toReportSearch,
  type ReportFilters,
} from './report-filter-bar';
import { ReportTable } from './report-table';
import { useExportReport, useReport } from './use-report';

export function ReportView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseReportFilters(searchParams);
  const page = parseReportPage(searchParams);
  const params = toReportParams(filters);

  const query = useReport(params);
  const exportMutation = useExportReport(params);
  const report = query.data;

  const total = report?.rows.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / REPORT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstItem = total === 0 ? 0 : (currentPage - 1) * REPORT_PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * REPORT_PAGE_SIZE, total);
  const rows = report
    ? report.rows.slice((currentPage - 1) * REPORT_PAGE_SIZE, currentPage * REPORT_PAGE_SIZE)
    : [];

  const exporting = exportMutation.isPending;
  const canExport = Boolean(report) && !exporting && !query.isFetching;

  function changeFilters(patch: Partial<ReportFilters>) {
    router.replace(toReportSearch({ ...filters, ...patch }), { scroll: false });
  }

  function changePage(nextPage: number) {
    router.replace(toReportSearch(filters, nextPage), { scroll: false });
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Laporan</h1>
          <p className="text-muted-foreground text-sm">
            Rekap kinerja per periode untuk pengisian e-Kinerja.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={!canExport}>
                {exporting ? (
                  <Loader2Icon aria-hidden="true" className="animate-spin" />
                ) : (
                  <DownloadIcon />
                )}
                Ekspor
                <ChevronDownIcon className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!canExport}
                onSelect={() => report && exportMutation.mutate({ format: 'xlsx', report })}
              >
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canExport}
                onSelect={() => report && exportMutation.mutate({ format: 'pdf', report })}
              >
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ReportFilterBar value={filters} onChange={changeFilters} />

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
        <div className="space-y-2" aria-busy="true" aria-label="Memuat laporan">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : report ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">{report.periodLabel}</p>
            <p className="text-muted-foreground text-sm">
              {total} kegiatan · {report.generatedAt}
            </p>
          </div>

          <ReportTable rows={rows} />

          {total > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Menampilkan {firstItem}–{lastItem} dari {total} kegiatan
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || query.isFetching}
                  onClick={() => changePage(currentPage - 1)}
                >
                  <ChevronLeftIcon />
                  Sebelumnya
                </Button>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || query.isFetching}
                  onClick={() => changePage(currentPage + 1)}
                >
                  Berikutnya
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
