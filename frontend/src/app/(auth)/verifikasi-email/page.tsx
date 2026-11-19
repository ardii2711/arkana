import type { Metadata } from 'next';
import { Suspense } from 'react';

import { VerifyEmailForm } from '@/features/profile/verify-email-form';

export const metadata: Metadata = {
  title: 'Verifikasi email',
};

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
