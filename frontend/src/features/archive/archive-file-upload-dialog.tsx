'use client';

import { Loader2Icon, TriangleAlertIcon, UploadIcon } from 'lucide-react';
import { useRef, useState } from 'react';
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/api-error';
import {
  FILE_ACCEPT,
  MAX_FILE_BYTES,
  fileExtension,
  formatFileSize,
  isAllowedFile,
} from '@/lib/file-format';
import type { ArchiveFolder } from './archive.api';
import { buildFolderTree, flattenFolders } from './archive.util';
import { useUploadArchiveFile } from './use-archive';

const NO_FOLDER = 'none';

type ArchiveFileUploadDialogProps = {
  folders: ArchiveFolder[];
  defaultFolderId: string | null;
  remainingBytes: number;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveFileUploadDialog({
  folders,
  defaultFolderId,
  remainingBytes,
  onOpenChange,
}: ArchiveFileUploadDialogProps) {
  const upload = useUploadArchiveFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId ?? NO_FOLDER);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const uploading = upload.isPending;
  const folderOptions = flattenFolders(buildFolderTree(folders));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError('Pilih file yang akan diunggah.');
      return;
    }

    if (!isAllowedFile(file)) {
      setError('Format file tidak didukung.');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError('Ukuran file melebihi batas 5 MB.');
      return;
    }

    if (file.size > remainingBytes) {
      setError('Sisa kuota arsip tidak mencukupi untuk file ini.');
      return;
    }

    try {
      setProgress(0);
      await upload.mutateAsync({
        input: {
          file,
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          documentDate: documentDate || undefined,
          folderId: folderId === NO_FOLDER ? undefined : folderId,
        },
        onProgress: setProgress,
      });
      toast.success('Dokumen diunggah.');
      onOpenChange(false);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && uploading) return;
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Unggah dokumen</DialogTitle>
          <DialogDescription>
            Maksimal 5 MB per file. Format: JPG, PNG, WEBP, HEIC, PDF, DOC, DOCX, XLS, XLSX.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
          <FieldGroup className="gap-4">
            {error ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel htmlFor="archive-upload-file">File</FieldLabel>
              <input
                ref={inputRef}
                id="archive-upload-file"
                type="file"
                accept={FILE_ACCEPT}
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                >
                  <UploadIcon />
                  Pilih file
                </Button>
                <p className="text-muted-foreground min-w-0 truncate text-sm">
                  {file
                    ? `${file.name} · ${fileExtension(file.name)} · ${formatFileSize(file.size)}`
                    : 'Belum ada file dipilih'}
                </p>
              </div>
            </Field>

            {uploading ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>Mengunggah…</span>
                  <span className="text-muted-foreground tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} aria-label="Progres unggah dokumen" />
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="archive-upload-name">Nama dokumen</FieldLabel>
              <Input
                id="archive-upload-name"
                maxLength={200}
                placeholder="Kosongkan untuk memakai nama file"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={uploading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="archive-upload-folder">Folder</FieldLabel>
              <Select value={folderId} onValueChange={setFolderId} disabled={uploading}>
                <SelectTrigger id="archive-upload-folder" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_FOLDER}>Tanpa folder</SelectItem>
                  {folderOptions.map((node) => (
                    <SelectItem key={node.folder.id} value={node.folder.id}>
                      {'— '.repeat(node.depth)}
                      {node.folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="archive-upload-date">Tanggal dokumen (opsional)</FieldLabel>
              <DatePicker
                id="archive-upload-date"
                value={documentDate}
                onChange={setDocumentDate}
                placeholder="Pilih tanggal dokumen"
                clearable
                disabled={uploading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="archive-upload-description">Deskripsi (opsional)</FieldLabel>
              <Textarea
                id="archive-upload-description"
                rows={3}
                maxLength={5000}
                placeholder="Keterangan singkat dokumen"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={uploading}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2Icon aria-hidden="true" className="animate-spin" />
                  Mengunggah…
                </>
              ) : (
                'Unggah'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
