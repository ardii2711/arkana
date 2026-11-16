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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getErrorMessage } from '@/lib/api-error';
import type { AdminAccount } from './users.api';
import { editUserSchema, type EditUserFormValues } from './users.schemas';
import { useUpdateUser } from './use-users';

type UserEditDialogProps = {
  account: AdminAccount;
  onOpenChange: (open: boolean) => void;
};

export function UserEditDialog({ account, onOpenChange }: UserEditDialogProps) {
  const update = useUpdateUser(account.id);
  const [formError, setFormError] = useState<string | null>(null);
  const isInvited = account.status === 'INVITED';

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: account.name,
      email: account.email,
      status: account.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    },
  });

  function onSubmit(values: EditUserFormValues) {
    setFormError(null);

    update.mutate(
      isInvited
        ? { name: values.name, email: values.email }
        : { name: values.name, email: values.email, status: values.status },
      {
        onSuccess: () => {
          toast.success('Akun diperbarui.');
          onOpenChange(false);
        },
        onError: (error) => setFormError(getErrorMessage(error)),
      },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah informasi akun</DialogTitle>
          <DialogDescription>
            Perubahan email dikirim ke alamat lama dan baru melalui email.
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
                  <FieldLabel htmlFor="edit-name">Nama lengkap</FieldLabel>
                  <Input
                    {...field}
                    id="edit-name"
                    maxLength={100}
                    aria-invalid={fieldState.invalid}
                    disabled={update.isPending}
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
                  <FieldLabel htmlFor="edit-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="edit-email"
                    type="email"
                    maxLength={255}
                    aria-invalid={fieldState.invalid}
                    disabled={update.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="edit-status">Status akun</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isInvited || update.isPending}
                  >
                    <SelectTrigger id="edit-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                  {isInvited ? (
                    <p className="text-muted-foreground text-xs">
                      Akun belum diaktivasi; status dapat diubah setelah pengguna mengaktifkan
                      akunnya.
                    </p>
                  ) : null}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={update.isPending}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? (
                <>
                  <Loader2Icon aria-hidden="true" className="animate-spin" />
                  Menyimpan…
                </>
              ) : (
                'Simpan perubahan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
