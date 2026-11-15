import { StickyNoteIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = {
  title: 'Catatan · ARKANA',
};

export default function NotePage() {
  return (
    <ModulePlaceholder
      title="Catatan"
      description="Simpan catatan, ide, dan hal yang perlu ditindaklanjuti."
      icon={StickyNoteIcon}
    />
  );
}
