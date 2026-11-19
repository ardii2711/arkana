import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { ArchiveView } from '@/features/archive/archive-view';

export const metadata: Metadata = {
  title: 'Arsip — ARKANA',
};

export default function ArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full space-y-6">
          <Skeleton className="h-16 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ArchiveView />
    </Suspense>
  );
}
