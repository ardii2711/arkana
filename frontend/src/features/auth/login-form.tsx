'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, MailIcon, TriangleAlertIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { GoogleIcon } from '@/components/shared/google-icon';
import { PasswordInput } from '@/components/shared/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { env } from '@/config/env';
import { getErrorMessage } from '@/lib/api-error';
import { AuthCard } from './auth-card';
import { loginSchema, type LoginValues } from './auth.schemas';
import { useLogin, useSession } from './use-auth';

const OAUTH_ERRORS: Record<string, string> = {
  oauth_cancelled: 'Login Google dibatalkan.',
  oauth_invalid_state: 'Sesi login Google tidak valid. Coba lagi.',
  account_not_registered: 'Email Google belum terdaftar. Hubungi Admin.',
  account_inactive: 'Akun Anda tidak aktif. Hubungi Admin.',
  google_account_mismatch: 'Akun Google tidak sesuai dengan akun terdaftar.',
  oauth_failed: 'Login Google gagal. Coba lagi.',
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const oauthError = OAUTH_ERRORS[searchParams.get('error') ?? ''] ?? null;
  const errorMessage = formError ?? oauthError;

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (session.data) router.replace('/');
  }, [session.data, router]);

  function onSubmit(values: LoginValues) {
    setFormError(null);
    login.mutate(values, {
      onSuccess: () => router.replace('/'),
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  }

  return (
    <AuthCard title="Masuk" description="Gunakan akun ARKANA yang terdaftar.">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {errorMessage ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <InputGroup className="h-11">
                  <InputGroupInput
                    {...field}
                    className="h-full"
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    placeholder="nama@instansi.go.id"
                    aria-invalid={fieldState.invalid}
                    disabled={login.isPending}
                  />
                  <InputGroupAddon align="inline-start">
                    <MailIcon aria-hidden="true" className="opacity-60" />
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor="login-password">Password</FieldLabel>
                  <Link
                    href="/lupa-password"
                    className="text-muted-foreground hover:text-foreground text-xs font-medium hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
                <PasswordInput
                  {...field}
                  id="login-password"
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  aria-invalid={fieldState.invalid}
                  disabled={login.isPending}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <Button type="submit" className="h-11 w-full" disabled={login.isPending}>
            {login.isPending ? (
              <>
                <Loader2Icon aria-hidden="true" className="animate-spin" />
                Memproses…
              </>
            ) : (
              'Masuk'
            )}
          </Button>

          <FieldSeparator>atau</FieldSeparator>

          <Button asChild variant="outline" className="h-11 w-full">
            <a href={`${env.NEXT_PUBLIC_API_URL}/auth/google`}>
              <GoogleIcon className="size-4" />
              Masuk dengan Google
            </a>
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
