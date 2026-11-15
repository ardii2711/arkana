import { ArchiveIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = {
  title: 'Arsip · ARKANA',
};

export default function ArchivePage() {
  return (
    <ModulePlaceholder
      title="Arsip"
      description="Simpan dan kelola dokumen pribadi dalam folder terstruktur."
      icon={ArchiveIcon}
    />
  );
}
