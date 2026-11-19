'use client';

import { EllipsisIcon, Loader2Icon, PencilIcon, SendIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getErrorMessage } from '@/lib/api-error';
import type { AdminAccount } from './users.api';
import { UserDeleteDialog } from './user-delete-dialog';
import { useResendInvitation } from './use-users';

type AccountActionsProps = {
  account: AdminAccount;
  onEdit: () => void;
  onDeleted: () => void;
};

export function AccountActions({ account, onEdit, onDeleted }: AccountActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const resend = useResendInvitation();

  function onResend() {
    resend.mutate(account.id, {
      onSuccess: () => toast.success('Undangan dikirim ulang.'),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${account.name}`}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {account.status === 'INVITED' ? (
            <DropdownMenuItem disabled={resend.isPending} onSelect={onResend}>
              {resend.isPending ? (
                <Loader2Icon aria-hidden="true" className="animate-spin" />
              ) : (
                <SendIcon aria-hidden="true" />
              )}
              Kirim ulang
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={onEdit}>
            <PencilIcon aria-hidden="true" />
            Ubah
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2Icon aria-hidden="true" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserDeleteDialog
        account={account}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={onDeleted}
      />
    </>
  );
}
