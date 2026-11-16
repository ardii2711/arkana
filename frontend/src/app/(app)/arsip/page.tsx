import type { Metadata } from 'next';

import { ArchiveView } from '@/features/archive/archive-view';

export const metadata: Metadata = {
  title: 'Arsip · ARKANA',
};

export default function ArchivePage() {
  return <ArchiveView />;
}
