'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, MailCheckIcon, MailIcon, TriangleAlertIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { getErrorMessage } from '@/lib/api-error';
import { AuthCard } from './auth-card';
import { forgotPasswordSchema, type ForgotPasswordValues } from './auth.schemas';
import { useRequestPasswordReset } from './use-auth';

export function ForgotPasswordForm() {
  const requestReset = useRequestPasswordReset();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    requestReset.mutate(values.email, {
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  }

  return (
    <AuthCard
      title="Lupa password"
      description="Masukkan email akun ARKANA Anda."
      footer={
        <Link className="text-foreground font-medium hover:underline" href="/login">
          Kembali ke halaman masuk
        </Link>
      }
    >
      {requestReset.isSuccess ? (
        <Alert>
          <MailCheckIcon />
          <AlertDescription>
            Jika email terdaftar dan aktif, tautan reset password sudah dikirim. Periksa kotak masuk
            Anda.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {formError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupInput
                      {...field}
                      className="h-full"
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      placeholder="nama@instansi.go.id"
                      aria-invalid={fieldState.invalid}
                      disabled={requestReset.isPending}
                    />
                    <InputGroupAddon align="inline-start">
                      <MailIcon aria-hidden="true" className="opacity-60" />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Button type="submit" className="h-11 w-full" disabled={requestReset.isPending}>
              {requestReset.isPending ? (
                <>
                  <Loader2Icon aria-hidden="true" className="animate-spin" />
                  Mengirim…
                </>
              ) : (
                'Kirim tautan reset'
              )}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthCard>
  );
}
