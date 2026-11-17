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
import { NAME_MAX_LENGTH } from '@/lib/limits';
import type { ArchiveFolder } from './archive.api';
import { folderSchema, type FolderFormValues } from './archive.schemas';
import { buildFolderTree, descendantIds, flattenFolders } from './archive.util';
import { useCreateArchiveFolder, useUpdateArchiveFolder } from './use-archive';

const NO_PARENT = 'none';

type ArchiveFolderDialogProps = {
  folders: ArchiveFolder[];
  folder: ArchiveFolder | null;
  defaultParentId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveFolderDialog({
  folders,
  folder,
  defaultParentId,
  onOpenChange,
}: ArchiveFolderDialogProps) {
  const isEdit = folder !== null;
  const create = useCreateArchiveFolder();
  const update = useUpdateArchiveFolder();
  const mutation = isEdit ? update : create;
  const [formError, setFormError] = useState<string | null>(null);

  const excluded = folder
    ? new Set([folder.id, ...descendantIds(folders, folder.id)])
    : new Set<string>();
  const parentOptions = flattenFolders(buildFolderTree(folders)).filter(
    (node) =>
      (node.depth < 2 || node.folder.id === folder?.parentId) && !excluded.has(node.folder.id),
  );

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: folder?.name ?? '',
      parentId: folder?.parentId ?? defaultParentId ?? NO_PARENT,
    },
  });

  function onSubmit(values: FolderFormValues) {
    setFormError(null);
    const parentId = values.parentId === NO_PARENT ? null : values.parentId;

    if (folder) {
      update.mutate(
        { id: folder.id, input: { name: values.name, parentId } },
        {
          onSuccess: () => {
            toast.success('Folder diperbarui.');
            onOpenChange(false);
          },
          onError: (error) => setFormError(getErrorMessage(error)),
        },
      );
      return;
    }

    create.mutate(
      { name: values.name, parentId },
      {
        onSuccess: () => {
          toast.success('Folder dibuat.');
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
          <DialogTitle>{isEdit ? 'Ubah folder' : 'Folder baru'}</DialogTitle>
          <DialogDescription>Folder dapat bertingkat maksimal 3 level.</DialogDescription>
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
                  <FieldLabel htmlFor="folder-name">Nama folder</FieldLabel>
                  <Input
                    {...field}
                    id="folder-name"
                    maxLength={NAME_MAX_LENGTH}
                    placeholder="Contoh: Sertifikat"
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="parentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="folder-parent">Folder induk</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="folder-parent"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT}>Tanpa induk (level 1)</SelectItem>
                      {parentOptions.map((node) => (
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
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
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
