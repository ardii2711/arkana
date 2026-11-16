'use client';

import { PinIcon, Trash2Icon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Note } from './note.api';
import { formatNoteTimestamp } from './note.format';
import { useDeleteNote, useToggleNotePin } from './use-notes';

type NoteCardProps = {
  note: Note;
  onEdit: (note: Note) => void;
};

export function NoteCard({ note, onEdit }: NoteCardProps) {
  const togglePin = useToggleNotePin(note.id);
  const remove = useDeleteNote();

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <button
          type="button"
          onClick={() => onEdit(note)}
          className="hover:text-foreground text-left text-sm leading-relaxed break-words"
        >
          <span className="line-clamp-5 whitespace-pre-line">{note.content}</span>
        </button>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">
            {formatNoteTimestamp(note.updatedAt)}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={note.pinned ? 'Hapus sematan' : 'Sematkan catatan'}
              aria-pressed={note.pinned}
              disabled={togglePin.isPending}
              className={note.pinned ? 'text-primary' : undefined}
              onClick={() => togglePin.mutate(!note.pinned)}
            >
              <PinIcon fill={note.pinned ? 'currentColor' : 'none'} />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Hapus catatan">
                  <Trash2Icon />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus catatan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Catatan ini akan dihapus permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(note.id)}
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
