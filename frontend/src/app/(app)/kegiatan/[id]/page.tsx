import type { Metadata } from 'next';

import { WorkLogDetail } from '@/features/work-logs/work-log-detail';

export const metadata: Metadata = {
  title: 'Detail Kegiatan · ARKANA',
};

export default async function WorkLogDetailPage({ params }: PageProps<'/kegiatan/[id]'>) {
  const { id } = await params;

  return <WorkLogDetail id={id} />;
}
