import { ClipboardListIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = {
  title: 'Kegiatan · ARKANA',
};

export default function WorkLogPage() {
  return (
    <ModulePlaceholder
      title="Kegiatan"
      description="Catat pekerjaan harian beserta bukti dukungnya."
      icon={ClipboardListIcon}
    />
  );
}
