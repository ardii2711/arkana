import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ScheduleView } from '@/features/schedules/schedule-view';

export const metadata: Metadata = {
  title: 'Agenda',
};

export default function SchedulePage() {
  return (
    <Suspense>
      <ScheduleView />
    </Suspense>
  );
}
