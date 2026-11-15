import { LayoutDashboardIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = {
  title: 'Dashboard · ARKANA',
};

export default function DashboardPage() {
  return (
    <ModulePlaceholder
      title="Dashboard"
      description="Ringkasan aktivitas dan akses cepat ARKANA."
      icon={LayoutDashboardIcon}
    />
  );
}
