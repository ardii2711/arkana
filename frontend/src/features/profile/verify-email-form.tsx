'use client';

import { CircleCheckIcon, Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/api-error';
import { AuthCard } from '@/features/auth/auth-card';
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
          <Link className="text-foreground font-medium hover:underline" href="/profil">
            Kembali ke profil
          </Link>
        }
      >
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>Buka tautan verifikasi langsung dari email Anda.</AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  if (verify.isPending) {
    return (
      <AuthCard title="Verifikasi email" description="Mohon tunggu sebentar.">
        <div className="flex items-center gap-3">
          <Loader2Icon className="text-muted-foreground size-5 animate-spin" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">Memverifikasi email Anda…</p>
        </div>
      </AuthCard>
    );
  }

  if (verify.isSuccess) {
    return (
      <AuthCard
        title="Email diperbarui"
        description="Email akun Anda berhasil diverifikasi dan diperbarui."
        footer={
          <Link className="text-foreground font-medium hover:underline" href="/profil">
            Kembali ke profil
          </Link>
        }
      >
        <Alert>
          <CircleCheckIcon />
          <AlertDescription>
            Gunakan email baru Anda saat masuk berikutnya. Notifikasi telah dikirim ke alamat lama
            dan baru.
          </AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verifikasi gagal"
      description="Tautan verifikasi tidak dapat digunakan."
      footer={
        <Link className="text-foreground font-medium hover:underline" href="/profil">
          Ajukan ulang di halaman profil
        </Link>
      }
    >
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertDescription>{getErrorMessage(verify.error)}</AlertDescription>
      </Alert>
    </AuthCard>
  );
}
