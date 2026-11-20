'use client';

import { CircleCheckIcon, Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-error';
import { AuthCard, AuthStatus } from '@/features/auth/auth-card';
import { useVerifyEmailChange } from './use-profile';

export function VerifyEmailForm() {
  const token = useSearchParams().get('token');
  const verify = useVerifyEmailChange();
  const fired = useRef(false);

  useEffect(() => {
    if (!token || fired.current) return;
    fired.current = true;
    verify.mutate(token);
  }, [token, verify]);

  if (!token) {
    return (
      <AuthCard
        title="Tautan tidak valid"
        description="Tautan verifikasi email tidak lengkap."
        footer={
          <Button asChild variant="outline" className="h-11 w-full">
            <Link href="/profil">Kembali ke profil</Link>
          </Button>
        }
      >
        <AuthStatus icon={<TriangleAlertIcon />} variant="error">
          Buka tautan verifikasi langsung dari email Anda.
        </AuthStatus>
      </AuthCard>
    );
  }

  if (verify.isPending) {
    return (
      <AuthCard title="Verifikasi email" description="Mohon tunggu sebentar.">
        <AuthStatus icon={<Loader2Icon className="animate-spin" />}>
          Memverifikasi email Anda…
        </AuthStatus>
      </AuthCard>
    );
  }

  if (verify.isSuccess) {
    return (
      <AuthCard
        title="Email diperbarui"
        description="Email akun Anda berhasil diverifikasi dan diperbarui."
        footer={
          <Button asChild className="h-11 w-full">
            <Link href="/profil">Kembali ke profil</Link>
          </Button>
        }
      >
        <AuthStatus icon={<CircleCheckIcon />}>
          Gunakan email baru Anda saat masuk berikutnya. Notifikasi telah dikirim ke alamat lama dan
          baru.
        </AuthStatus>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verifikasi gagal"
      description="Tautan verifikasi tidak dapat digunakan."
      footer={
        <Button asChild variant="outline" className="h-11 w-full">
          <Link href="/profil">Ajukan ulang di halaman profil</Link>
        </Button>
      }
    >
      <AuthStatus icon={<TriangleAlertIcon />} variant="error">
        {getErrorMessage(verify.error)}
      </AuthStatus>
    </AuthCard>
  );
}
