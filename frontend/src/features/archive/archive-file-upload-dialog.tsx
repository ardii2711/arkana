'use client';

import { CheckCircle2Icon, Loader2Icon, UploadCloudIcon, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import { DatePicker } from '@/components/shared/date-picker';
import { FileTypeIcon } from '@/components/shared/file-type-icon';
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
import { useObjectUrl } from '@/hooks/use-object-url';
import { getErrorMessage, toApiError } from '@/lib/api-error';
import { BODY_MAX_LENGTH, MAX_FILE_BYTES, TITLE_MAX_LENGTH } from '@/lib/limits';
import { FILE_ACCEPT, fileExtension, formatFileSize, isAllowedFile } from '@/lib/file-format';
import { cn } from '@/lib/utils';
import type { ArchiveFolder } from './archive.api';
import { ARCHIVE_ROOT, buildFolderTree, flattenFolders } from './archive.util';
import { useUploadArchiveFile } from './use-archive';

const PREVIEWABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type ArchiveFileUploadDialogProps = {
  folders: ArchiveFolder[];
  defaultFolderId: string | null;
  remainingBytes: number;
  onOpenChange: (open: boolean) => void;
};

function Thumb({ file }: { file: File }) {
  const url = useObjectUrl(PREVIEWABLE_TYPES.includes(file.type) ? file : undefined);

  if (!url) {
    return (
      <div className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5">
        <FileTypeIcon mimeType={file.type} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
  );
}

function canRetry(error: unknown) {
  const status = toApiError(error).status;

  return status === null || status >= 500;
}

export function ArchiveFileUploadDialog({
  folders,
  defaultFolderId,
  remainingBytes,
  onOpenChange,
}: ArchiveFileUploadDialogProps) {
  const upload = useUploadArchiveFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const folderOptions = flattenFolders(buildFolderTree(folders));
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId ?? ARCHIVE_ROOT);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const uploading = upload.isPending;

  const fileError = !file
    ? null
    : !isAllowedFile(file)
      ? 'Format file tidak didukung.'
      : file.size > MAX_FILE_BYTES
        ? `Ukuran file melebihi batas ${formatFileSize(MAX_FILE_BYTES)}.`
        : file.size > remainingBytes
          ? 'Sisa kuota arsip tidak mencukupi untuk file ini.'
          : null;

  function pick(next: File | null) {
    setFile(next);
    setError(null);
  }

  async function send(attempt = 0) {
    if (!file || fileError) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setError(null);
    setProgress(0);

    try {
      await upload.mutateAsync({
        input: {
          file,
          folderId: folderId === ARCHIVE_ROOT ? null : folderId,
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          documentDate: documentDate || undefined,
        },
        onProgress: setProgress,
        signal: controller.signal,
      });

      setDone(true);
    } catch (uploadError) {
      if (controller.signal.aborted) {
        setProgress(0);
        return;
      }

      if (attempt === 0 && canRetry(uploadError)) {
        await send(1);
        return;
      }

      setError(getErrorMessage(uploadError));
    } finally {
      controllerRef.current = null;
    }
  }

  function reset() {
    setFile(null);
    setName('');
    setDescription('');
    setDocumentDate('');
    setProgress(0);
    setError(null);
    setDone(false);
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
          <DialogTitle>{done ? 'Dokumen tersimpan' : 'Unggah dokumen'}</DialogTitle>
          <DialogDescription>
            {done
              ? 'Dokumen sudah masuk ke arsip Anda.'
              : `Maksimal ${formatFileSize(MAX_FILE_BYTES)} per file. Format: JPG, PNG, WEBP, HEIC, PDF, DOC, DOCX, XLS, XLSX.`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex items-center gap-3 rounded-xl border p-4">
            <CheckCircle2Icon
              aria-hidden="true"
              className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            />
            <p className="min-w-0 truncate text-sm font-medium">{file?.name}</p>
          </div>
        ) : (
          <FieldGroup className="gap-4">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (uploading) return;
                pick(event.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center',
                dragging && 'bg-muted/60 border-primary',
              )}
            >
              {file ? (
                <div className="flex w-full min-w-0 items-center gap-3 text-left">
                  <Thumb file={file} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {fileExtension(file.name)} · {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Hapus file terpilih"
                    disabled={uploading}
                    onClick={() => pick(null)}
                  >
                    <XIcon />
                  </Button>
                </div>
              ) : (
                <>
                  <UploadCloudIcon aria-hidden="true" className="text-muted-foreground size-5" />
                  <p className="text-sm">Tarik file ke sini atau</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    Pilih file
                  </Button>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={FILE_ACCEPT}
                className="sr-only"
                aria-label="Pilih file"
                onChange={(event) => {
                  pick(event.target.files?.[0] ?? null);
                  event.target.value = '';
                }}
              />
            </div>

            {fileError ? <p className="text-destructive text-sm">{fileError}</p> : null}
            {error ? <p className="text-destructive text-sm">{error}</p> : null}

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
                maxLength={TITLE_MAX_LENGTH}
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
                maxLength={BODY_MAX_LENGTH}
                placeholder="Keterangan singkat dokumen"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={uploading}
              />
            </Field>
          </FieldGroup>
        )}

        <DialogFooter>
          {done ? (
            <>
              <Button variant="outline" onClick={reset}>
                Unggah lagi
              </Button>
              <Button onClick={() => onOpenChange(false)}>Tutup</Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => (uploading ? controllerRef.current?.abort() : onOpenChange(false))}
              >
                {uploading ? 'Batalkan unggahan' : 'Batal'}
              </Button>
              <Button
                type="button"
                disabled={!file || fileError !== null || uploading}
                onClick={() => void send()}
              >
                {uploading ? (
                  <>
                    <Loader2Icon aria-hidden="true" className="animate-spin" />
                    Mengunggah…
                  </>
                ) : (
                  'Unggah'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
