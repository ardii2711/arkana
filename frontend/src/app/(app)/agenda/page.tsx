import type { Metadata } from 'next';

import { ScheduleView } from '@/features/schedules/schedule-view';

export const metadata: Metadata = {
  title: 'Agenda',
};

export default function SchedulePage() {
  return <ScheduleView />;
}
