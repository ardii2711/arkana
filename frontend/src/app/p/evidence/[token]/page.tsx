import type { Metadata } from 'next';

import { WorkLogPublicView } from '@/features/work-logs/work-log-public-view';

export const metadata: Metadata = {
  title: 'Bukti Dukung',
  robots: { index: false, follow: false },
};

export default async function PublicEvidencePage({ params }: PageProps<'/p/evidence/[token]'>) {
  const { token } = await params;

  return <WorkLogPublicView token={token} />;
}
