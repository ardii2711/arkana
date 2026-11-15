import type { Metadata } from 'next';

import { ForgotPasswordForm } from '@/features/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Lupa password · ARKANA',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
