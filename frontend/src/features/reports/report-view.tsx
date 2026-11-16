'use client';

import { CalendarRangeIcon, DownloadIcon, RotateCcwIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import {
  DEFAULT_REPORT_FILTERS,
  isReportReady,
  parseReportFilters,
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
  const ready = isReportReady(filters);
  const params = toReportParams(filters);

  const query = useReport(params, ready);
  const exportMutation = useExportReport(params);
  const report = query.data;

  const isDefault = toReportSearch(filters) === toReportSearch(DEFAULT_REPORT_FILTERS);
  const exporting = exportMutation.isPending;

  function changeFilters(patch: Partial<ReportFilters>) {
    router.replace(toReportSearch({ ...filters, ...patch }), { scroll: false });
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
          <Button
            variant="ghost"
            disabled={isDefault}
            onClick={() => router.replace('/laporan', { scroll: false })}
          >
            <RotateCcwIcon />
            Reset
          </Button>
          <Button
            variant="outline"
            disabled={!report || exporting}
            onClick={() => report && exportMutation.mutate({ format: 'xlsx', report })}
          >
            <DownloadIcon />
            XLSX
          </Button>
          <Button
            disabled={!report || exporting}
            onClick={() => report && exportMutation.mutate({ format: 'pdf', report })}
          >
            <DownloadIcon />
            PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <ReportFilterBar value={filters} onChange={changeFilters} />
        </CardContent>
      </Card>

      {!ready ? (
        <Alert>
          <CalendarRangeIcon />
          <AlertDescription>
            Pilih rentang tanggal mulai dan selesai untuk periode rentang khusus.
          </AlertDescription>
        </Alert>
      ) : null}

      {query.isPending && ready ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : null}

      {query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(query.error)}</AlertDescription>
        </Alert>
      ) : null}

      {report ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">{report.periodLabel}</p>
            <p className="text-muted-foreground text-sm">
              {report.rows.length} kegiatan · dibuat {report.generatedAt}
            </p>
          </div>
          <ReportTable rows={report.rows} />
        </div>
      ) : null}
    </div>
  );
}
