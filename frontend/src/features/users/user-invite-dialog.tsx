'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/api-error';
import { NAME_MAX_LENGTH } from '@/lib/limits';
import { inviteUserSchema, type InviteUserFormValues } from './users.schemas';
import { useInviteUser } from './use-users';

type UserInviteDialogProps = {
  onOpenChange: (open: boolean) => void;
};

export function UserInviteDialog({ onOpenChange }: UserInviteDialogProps) {
  const invite = useInviteUser();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { name: '', email: '' },
  });

  function onSubmit(values: InviteUserFormValues) {
    setFormError(null);

    invite.mutate(values, {
      onSuccess: () => {
        toast.success('Undangan dikirim ke email pengguna.');
        onOpenChange(false);
      },
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Undang pengguna</DialogTitle>
          <DialogDescription>
            Pengguna akan menerima email berisi tautan untuk mengaktifkan akun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup className="gap-4">
            {formError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="invite-name">Nama lengkap</FieldLabel>
                  <Input
                    {...field}
                    id="invite-name"
                    autoFocus
                    maxLength={NAME_MAX_LENGTH}
                    placeholder="Contoh: Budi Santoso"
                    aria-invalid={fieldState.invalid}
                    disabled={invite.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="invite-email"
                    type="email"
                    maxLength={255}
                    placeholder="nama@example.go.id"
                    aria-invalid={fieldState.invalid}
                    disabled={invite.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={invite.isPending}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? (
                <>
                  <Loader2Icon aria-hidden="true" className="animate-spin" />
                  Mengirim undangan…
                </>
              ) : (
                'Kirim undangan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
