import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { WorkLogList } from '@/features/work-logs/work-log-list';

export const metadata: Metadata = {
  title: 'Kegiatan',
};

export default function WorkLogPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full space-y-6">
          <Skeleton className="h-16 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <WorkLogList />
    </Suspense>
  );
}
