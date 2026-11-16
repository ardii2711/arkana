'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/api-error';
import { downloadBlob } from '@/lib/download';
import {
  fetchReport,
  fetchReportExport,
  reportFileName,
  type ReportData,
  type ReportFormat,
  type ReportParams,
} from './report.api';

const rootKey = ['reports'] as const;

export function useReport(params: ReportParams, enabled: boolean) {
  return useQuery({
    queryKey: [...rootKey, 'work-logs', params],
    queryFn: () => fetchReport(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useExportReport(params: ReportParams) {
  return useMutation({
    mutationFn: ({ format }: { format: ReportFormat; report: ReportData }) =>
      fetchReportExport(params, format),
    onSuccess: (blob, { format, report }) => {
      downloadBlob(blob, reportFileName(report, format));
      toast.success(`Laporan ${format.toUpperCase()} berhasil diunduh`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
