'use client';

import { EllipsisIcon, PinIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/date';
import type { Note } from './note.api';
import { useDeleteNote, useToggleNotePin } from './use-notes';

type NoteCardProps = {
  note: Note;
  onEdit: (note: Note) => void;
};

export function NoteCard({ note, onEdit }: NoteCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const togglePin = useToggleNotePin(note.id);
  const remove = useDeleteNote();

  function handlePin() {
    togglePin.mutate(!note.pinned, {
      onSuccess: () => toast.success(note.pinned ? 'Sematan dilepas.' : 'Catatan disematkan.'),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function handleDelete() {
    remove.mutate(note.id, {
      onSuccess: () => {
        toast.success('Catatan dihapus.');
        setDeleteOpen(false);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Card className="hover:border-primary/40 h-full transition-colors">
      <CardContent className="flex h-full flex-col gap-3">
        <button
          type="button"
          onClick={() => onEdit(note)}
          className="hover:text-foreground text-left text-sm leading-relaxed break-words"
        >
          <span className="line-clamp-5 whitespace-pre-line">{note.content}</span>
        </button>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            {note.pinned ? (
              <PinIcon aria-hidden="true" className="text-primary size-3 fill-current" />
            ) : null}
            Diperbarui {formatDateTime(note.updatedAt)}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={note.pinned ? 'Hapus sematan' : 'Sematkan catatan'}
              aria-pressed={note.pinned}
              disabled={togglePin.isPending}
              className={note.pinned ? 'text-primary' : undefined}
              onClick={handlePin}
            >
              <PinIcon fill={note.pinned ? 'currentColor' : 'none'} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Aksi untuk catatan ${formatDateTime(note.updatedAt)}`}
                >
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => onEdit(note)}>
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
          </div>
        </div>
      </CardContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus catatan?</AlertDialogTitle>
            <AlertDialogDescription>Catatan ini akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
