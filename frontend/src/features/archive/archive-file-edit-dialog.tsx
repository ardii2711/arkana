'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { DatePicker } from '@/components/shared/date-picker';
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
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/api-error';
import { BODY_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/lib/limits';
import type { ArchiveFile, ArchiveFolder } from './archive.api';
import { fileMetaSchema, type FileMetaFormValues } from './archive.schemas';
import { ARCHIVE_ROOT, buildFolderTree, flattenFolders } from './archive.util';
import { useUpdateArchiveFile } from './use-archive';

type ArchiveFileEditDialogProps = {
  file: ArchiveFile;
  folders: ArchiveFolder[];
  onOpenChange: (open: boolean) => void;
};

export function ArchiveFileEditDialog({ file, folders, onOpenChange }: ArchiveFileEditDialogProps) {
  const update = useUpdateArchiveFile();
  const [formError, setFormError] = useState<string | null>(null);
  const folderOptions = flattenFolders(buildFolderTree(folders));

  const form = useForm<FileMetaFormValues>({
    resolver: zodResolver(fileMetaSchema),
    defaultValues: {
      name: file.name,
      description: file.description ?? '',
      documentDate: file.documentDate ?? '',
      folderId: file.folderId ?? ARCHIVE_ROOT,
    },
  });

  function onSubmit(values: FileMetaFormValues) {
    setFormError(null);
    update.mutate(
      {
        id: file.id,
        input: {
          name: values.name,
          description: values.description || null,
          documentDate: values.documentDate || null,
          folderId: values.folderId === ARCHIVE_ROOT ? null : values.folderId,
        },
      },
      {
        onSuccess: () => {
          toast.success('Dokumen diperbarui.');
          onOpenChange(false);
        },
        onError: (error) => setFormError(getErrorMessage(error)),
      },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ubah dokumen</DialogTitle>
          <DialogDescription>{file.originalName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup className="max-h-[60vh] gap-4 overflow-y-auto px-1">
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
                  <FieldLabel htmlFor="archive-edit-name">Nama dokumen</FieldLabel>
                  <Input
                    {...field}
                    id="archive-edit-name"
                    maxLength={TITLE_MAX_LENGTH}
                    aria-invalid={fieldState.invalid}
                    disabled={update.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="folderId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="archive-edit-folder">Folder</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={update.isPending}
                  >
                    <SelectTrigger
                      id="archive-edit-folder"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Pilih folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ARCHIVE_ROOT}>Arsip utama</SelectItem>
                      {folderOptions.map((node) => (
                        <SelectItem key={node.folder.id} value={node.folder.id}>
                          {'— '.repeat(node.depth)}
                          {node.folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="documentDate"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="archive-edit-date">Tanggal dokumen (opsional)</FieldLabel>
                  <DatePicker
                    id="archive-edit-date"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pilih tanggal dokumen"
                    clearable
                    disabled={update.isPending}
                  />
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="archive-edit-description">Deskripsi (opsional)</FieldLabel>
                  <Textarea
                    {...field}
                    id="archive-edit-description"
                    rows={3}
                    maxLength={BODY_MAX_LENGTH}
                    aria-invalid={form.formState.errors.description ? true : undefined}
                    disabled={update.isPending}
                  />
                  {form.formState.errors.description ? (
                    <FieldError errors={[form.formState.errors.description]} />
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
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
