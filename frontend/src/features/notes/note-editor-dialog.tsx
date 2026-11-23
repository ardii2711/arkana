'use client';

import { Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/api-error';
import { NOTE_MAX_LENGTH } from '@/lib/limits';
import type { Note } from './note.api';
import { useCreateNote, useUpdateNote } from './use-notes';

type NoteEditorDialogProps = {
  note: Note | null;
  onOpenChange: (open: boolean) => void;
};

export function NoteEditorDialog({ note, onOpenChange }: NoteEditorDialogProps) {
  const isEdit = note !== null;
  const create = useCreateNote();
  const update = useUpdateNote(note?.id ?? '');
  const mutation = isEdit ? update : create;
  const initialContent = note?.content ?? '';
  const [content, setContent] = useState(initialContent);
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const trimmed = content.trim();
  const isValid = trimmed.length >= 1 && trimmed.length <= NOTE_MAX_LENGTH;
  const isDirty = content !== initialContent || pinned !== (note?.pinned ?? false);

  function requestClose() {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }

    onOpenChange(false);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    mutation.mutate(
      { content: trimmed, pinned },
      {
        onSuccess: () => {
          toast.success(isEdit ? 'Catatan diperbarui.' : 'Catatan disimpan.');
          onOpenChange(false);
        },
        onError: (mutationError) => setError(getErrorMessage(mutationError)),
      },
    );
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && requestClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Ubah catatan' : 'Catatan baru'}</DialogTitle>
            <DialogDescription>
              Catatan bebas, tanpa judul. Maksimal 20.000 karakter.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="note-content" className="sr-only">
                Isi catatan
              </FieldLabel>
              <Textarea
                id="note-content"
                autoFocus
                rows={10}
                maxLength={NOTE_MAX_LENGTH}
                placeholder="Tulis catatan, ide, atau hal yang perlu ditindaklanjuti..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
              <div className="flex items-center justify-between gap-3">
                {content.length > 0 && trimmed.length === 0 ? (
                  <p className="text-destructive text-xs">
                    Catatan tidak boleh hanya berisi spasi.
                  </p>
                ) : null}
                <p className="text-muted-foreground ml-auto text-xs">
                  {content.length.toLocaleString('id-ID')} /{' '}
                  {NOTE_MAX_LENGTH.toLocaleString('id-ID')}
                </p>
              </div>
            </Field>

            <Field>
              <label htmlFor="note-pinned" className="flex items-center gap-2">
                <input
                  id="note-pinned"
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={pinned}
                  onChange={(event) => setPinned(event.target.checked)}
                />
                <span className="text-sm font-medium">Sematkan catatan</span>
              </label>
            </Field>

            {error ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={requestClose}>
                Batal
              </Button>
              <Button type="submit" disabled={!isValid || mutation.isPending}>
                {mutation.isPending ? <Loader2Icon className="animate-spin" /> : null}
                {isEdit ? 'Simpan perubahan' : 'Simpan catatan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buang perubahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Perubahan yang belum disimpan akan hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Lanjut mengedit</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              Buang perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
