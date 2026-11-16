import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { ReportView } from '@/features/reports/report-view';

export const metadata: Metadata = {
  title: 'Laporan · ARKANA',
};

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full space-y-6">
          <Skeleton className="h-16 w-64" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ReportView />
    </Suspense>
  );
}
