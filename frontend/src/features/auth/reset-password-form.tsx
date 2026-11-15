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
import { useResetPassword } from './use-auth';

export function ResetPasswordForm() {
  const token = useSearchParams().get('token');
  const reset = useResetPassword();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  function onSubmit(values: NewPasswordValues) {
    if (!token) return;

    setFormError(null);
    reset.mutate(
      { token, password: values.password },
      { onError: (error) => setFormError(getErrorMessage(error)) },
    );
  }

  if (reset.isSuccess) {
    return (
      <AuthCard
        title="Password diperbarui"
        description="Password baru sudah tersimpan."
        footer={
          <Link className="text-foreground font-medium hover:underline" href="/login">
            Masuk ke ARKANA
          </Link>
        }
      >
        <Alert>
          <CircleCheckIcon />
          <AlertDescription>Silakan masuk menggunakan password baru Anda.</AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  if (!token) {
    return (
      <AuthCard
        title="Tautan tidak valid"
        description="Tautan reset password tidak lengkap."
        footer={
          <Link className="text-foreground font-medium hover:underline" href="/lupa-password">
            Minta tautan baru
          </Link>
        }
      >
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>Buka tautan reset password langsung dari email Anda.</AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset password" description="Buat password baru untuk akun Anda.">
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
                <FieldLabel htmlFor="reset-password">Password baru</FieldLabel>
                <PasswordInput
                  {...field}
                  id="reset-password"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  aria-invalid={fieldState.invalid}
                  disabled={reset.isPending}
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
                <FieldLabel htmlFor="reset-confirm">Ulangi password</FieldLabel>
                <PasswordInput
                  {...field}
                  id="reset-confirm"
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  aria-invalid={fieldState.invalid}
                  disabled={reset.isPending}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <Button type="submit" className="h-11 w-full" disabled={reset.isPending}>
            {reset.isPending ? (
              <>
                <Loader2Icon aria-hidden="true" className="animate-spin" />
                Menyimpan…
              </>
            ) : (
              'Simpan password'
            )}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
