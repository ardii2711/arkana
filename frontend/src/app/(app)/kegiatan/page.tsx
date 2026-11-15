import type { Metadata } from 'next';

import { WorkLogList } from '@/features/work-logs/work-log-list';

export const metadata: Metadata = {
  title: 'Kegiatan · ARKANA',
};

export default function WorkLogPage() {
  return <WorkLogList />;
}
