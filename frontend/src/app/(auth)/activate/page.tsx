import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ActivateForm } from '@/features/auth/activate-form';

export const metadata: Metadata = {
  title: 'Aktivasi akun · ARKANA',
};

export default function ActivatePage() {
  return (
    <Suspense>
      <ActivateForm />
    </Suspense>
  );
}
