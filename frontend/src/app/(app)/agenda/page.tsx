import { CalendarDaysIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = {
  title: 'Agenda · ARKANA',
};

export default function SchedulePage() {
  return (
    <ModulePlaceholder
      title="Agenda"
      description="Kelola jadwal kegiatan, tenggat waktu, dan agenda pribadi."
      icon={CalendarDaysIcon}
    />
  );
}
