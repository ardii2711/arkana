import { UsersIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = {
  title: 'Akun · ARKANA',
};

export default function AccountPage() {
  return (
    <ModulePlaceholder
      title="Akun"
      description="Kelola akun pengguna, undangan, dan status akses."
      icon={UsersIcon}
    />
  );
}
