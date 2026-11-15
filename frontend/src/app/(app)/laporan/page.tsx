import { FileTextIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = {
  title: 'Laporan · ARKANA',
};

export default function ReportPage() {
  return (
    <ModulePlaceholder
      title="Laporan"
      description="Susun rekap kinerja berdasarkan periode dan kategori."
      icon={FileTextIcon}
    />
  );
}
