'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheckIcon, Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { PasswordInput } from '@/components/shared/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { getErrorMessage } from '@/lib/api-error';
import { AuthCard } from './auth-card';
import { newPasswordSchema, type NewPasswordValues } from './auth.schemas';
import { useActivateAccount, useActivationInfo } from './use-auth';

export function ActivateForm() {
  const token = useSearchParams().get('token');
  const info = useActivationInfo(token);
  const activate = useActivateAccount();
  const busy = activate.isPending || info.isPending;
  const [formError, setFormError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  function onSubmit(values: NewPasswordValues) {
    if (!token) return;

    setFormError(null);
    activate.mutate(
      { token, password: values.password },
      {
        onSuccess: () => setActivated(true),
        onError: (error) => setFormError(getErrorMessage(error)),
      },
    );
  }

  if (!token || info.isError) {
    return (
      <AuthCard
        title="Aktivasi tidak valid"
        description="Tautan aktivasi tidak valid atau sudah kedaluwarsa."
        footer={
          <Link className="text-foreground font-medium hover:underline" href="/login">
            Kembali ke halaman masuk
          </Link>
        }
      >
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>
            Minta Admin mengirim ulang undangan, lalu buka tautan terbaru dari email Anda.
          </AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  if (activated) {
    return (
      <AuthCard
        title="Akun aktif"
        description="Password berhasil dibuat. Silakan masuk."
        footer={
          <Link className="text-foreground font-medium hover:underline" href="/login">
            Masuk ke ARKANA
          </Link>
        }
      >
        <Alert>
          <CircleCheckIcon />
          <AlertDescription>Akun Anda sudah dapat digunakan.</AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Aktivasi akun"
      description={info.data ? `${info.data.name} · ${info.data.email}` : 'Memuat data akun…'}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {formError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="activate-password">Password baru</FieldLabel>
                <PasswordInput
                  {...field}
                  id="activate-password"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  aria-invalid={fieldState.invalid}
                  disabled={busy}
                />
                <FieldDescription>Minimal 8 karakter.</FieldDescription>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="activate-confirm">Ulangi password</FieldLabel>
                <PasswordInput
                  {...field}
                  id="activate-confirm"
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  aria-invalid={fieldState.invalid}
                  disabled={busy}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {activate.isPending ? (
              <>
                <Loader2Icon aria-hidden="true" className="animate-spin" />
                Menyimpan…
              </>
            ) : (
              'Aktifkan akun'
            )}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
