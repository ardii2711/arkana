'use client';

import { Loader2Icon, Trash2Icon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { getErrorMessage } from '@/lib/api-error';
import { USER_STATUS_BADGES, USER_STATUS_LABELS, type AdminAccount } from './users.api';
import { useDeleteUser } from './use-users';

type UserDeleteDialogProps = {
  account: AdminAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function UserDeleteDialog({
  account,
  open,
  onOpenChange,
  onDeleted,
}: UserDeleteDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const remove = useDeleteUser();
  const matches = confirmation.trim() === account.email;

  function close() {
    if (remove.isPending) return;

    setConfirmation('');
    onOpenChange(false);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!matches || remove.isPending) return;

    remove.mutate(account.id, {
      onSuccess: () => {
        toast.success(`Akun ${account.email} dihapus.`);
        setConfirmation('');
        onDeleted();
        onOpenChange(false);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md" showCloseButton={!remove.isPending}>
        <DialogHeader>
          <DialogTitle>Hapus akun</DialogTitle>
          <DialogDescription className="sr-only">
            Konfirmasi penghapusan akun pengguna secara permanen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-full">
            <Trash2Icon aria-hidden="true" className="text-muted-foreground size-6" />
          </div>
          <p className="font-heading text-lg font-semibold break-all">{account.name}</p>
          <p className="text-muted-foreground text-sm break-all">{account.email}</p>
          <Badge variant={USER_STATUS_BADGES[account.status]}>
            {USER_STATUS_LABELS[account.status]}
          </Badge>
        </div>

        <Separator />

        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-sm">
            Untuk konfirmasi, ketik <span className="font-semibold">{account.email}</span> pada
            kolom di bawah.
          </p>
          <Input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            aria-label={`Ketik ${account.email} untuk konfirmasi`}
            aria-invalid={confirmation !== '' && !matches}
            autoComplete="off"
            autoFocus
            disabled={remove.isPending}
            className="font-mono"
          />
          <p className="text-muted-foreground text-xs">
            Seluruh kegiatan, bukti dukung, arsip, agenda, catatan, dan foto profil akan dihapus
            permanen. Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="flex flex-col gap-2 pt-1">
            <Button type="submit" variant="destructive" disabled={!matches || remove.isPending}>
              {remove.isPending ? (
                <>
                  <Loader2Icon aria-hidden="true" className="animate-spin" />
                  Menghapus…
                </>
              ) : (
                'Hapus akun ini'
              )}
            </Button>
            <Button type="button" variant="outline" disabled={remove.isPending} onClick={close}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
