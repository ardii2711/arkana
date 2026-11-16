'use client';

import {
  DownloadIcon,
  EyeIcon,
  Loader2Icon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import {
  FILE_ACCEPT,
  MAX_FILES_PER_WORK_LOG,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES_PER_WORK_LOG,
  downloadWorkLogFile,
  fileExtension,
  formatFileSize,
  isAllowedFile,
  type WorkLogFile,
} from './work-log-file.api';
import { FileTypeIcon } from './work-log-file-icon';
import {
  useDeleteWorkLogFile,
  useUploadWorkLogFile,
  useWorkLogFileBlob,
  useWorkLogFiles,
} from './use-work-log-files';

type UploadItem = {
  key: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  message?: string;
};

export function WorkLogEvidence({ workLogId }: { workLogId: string }) {
  const query = useWorkLogFiles(workLogId);
  const upload = useUploadWorkLogFile(workLogId);
  const remove = useDeleteWorkLogFile(workLogId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<WorkLogFile | null>(null);
  const [toDelete, setToDelete] = useState<WorkLogFile | null>(null);

  const files = query.data ?? [];
  const usedBytes = files.reduce((total, file) => total + file.size, 0);
  const slotsLeft = MAX_FILES_PER_WORK_LOG - files.length;
  const isUploading = uploads.some(
    (item) => item.status === 'pending' || item.status === 'uploading',
  );

  const previewBlob = useWorkLogFileBlob(workLogId, preview?.id ?? '', preview !== null);
  const previewUrl = useMemo(
    () => (previewBlob.data ? URL.createObjectURL(previewBlob.data) : null),
    [previewBlob.data],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function patchUpload(index: number, patch: Partial<UploadItem>) {
    setUploads((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSelected(selected: FileList | null) {
    const incoming = selected ? Array.from(selected) : [];
    if (inputRef.current) inputRef.current.value = '';
    if (incoming.length === 0) return;

    const unsupported = incoming.find((file) => !isAllowedFile(file));
    if (unsupported) {
      toast.error(`Format ${unsupported.name} tidak didukung.`);
      return;
    }

    if (incoming.length > slotsLeft) {
      toast.error(`Maksimal ${MAX_FILES_PER_WORK_LOG} file per kegiatan. Sisa ${slotsLeft} slot.`);
      return;
    }

    const oversized = incoming.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) {
      toast.error(`${oversized.name} melebihi batas 5 MB.`);
      return;
    }

    const incomingBytes = incoming.reduce((total, file) => total + file.size, 0);
    if (usedBytes + incomingBytes > MAX_TOTAL_BYTES_PER_WORK_LOG) {
      toast.error('Total bukti dukung kegiatan melebihi 50 MB.');
      return;
    }

    setUploads(
      incoming.map((file) => ({
        key: crypto.randomUUID(),
        name: file.name,
        progress: 0,
        status: 'pending',
      })),
    );
    setUploadOpen(true);

    let uploaded = 0;

    for (const [index, file] of incoming.entries()) {
      patchUpload(index, { status: 'uploading' });

      try {
        await upload.mutateAsync({
          file,
          onProgress: (progress) => patchUpload(index, { progress }),
        });
        patchUpload(index, { status: 'done', progress: 100 });
        uploaded += 1;
      } catch (error) {
        patchUpload(index, { status: 'error', message: getErrorMessage(error) });
      }
    }

    if (uploaded > 0) toast.success(`${uploaded} file diunggah.`);
  }

  async function handleDownload(file: WorkLogFile) {
    try {
      await downloadWorkLogFile(workLogId, file);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function handleDelete() {
    if (!toDelete) return;

    remove.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success('Bukti dukung dihapus.');
        setToDelete(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Bukti dukung</h2>
          <p className="text-muted-foreground text-sm">
            {files.length} file · {formatFileSize(usedBytes)} dari{' '}
            {formatFileSize(MAX_TOTAL_BYTES_PER_WORK_LOG)} · maks 5 MB per file
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={FILE_ACCEPT}
          className="sr-only"
          aria-label="Pilih file bukti dukung"
          onChange={(event) => void handleSelected(event.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isUploading || slotsLeft <= 0}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2Icon aria-hidden="true" className="animate-spin" />
              Mengunggah…
            </>
          ) : (
            <>
              <UploadIcon />
              Unggah file
            </>
          )}
        </Button>
      </div>

      {query.isError ? (
        <div className="space-y-3">
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{getErrorMessage(query.error)}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => query.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : query.isPending ? (
        <ul
          className="divide-y rounded-xl border"
          aria-busy="true"
          aria-label="Memuat bukti dukung"
        >
          {[0, 1].map((row) => (
            <li key={row} className="flex items-center gap-3 p-4">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/5" />
              </div>
            </li>
          ))}
        </ul>
      ) : files.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          Belum ada bukti dukung. Unggah foto atau dokumen pendukung kegiatan ini.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <FileTypeIcon mimeType={file.mimeType} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.originalName}</p>
                  <p className="text-muted-foreground text-xs">
                    {fileExtension(file.originalName)} · {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {file.previewable ? (
                  <Button variant="ghost" size="sm" onClick={() => setPreview(file)}>
                    <EyeIcon />
                    Lihat
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" onClick={() => void handleDownload(file)}>
                  <DownloadIcon />
                  Unduh
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Hapus ${file.originalName}`}
                  onClick={() => setToDelete(file)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!open && isUploading) return;
          setUploadOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Unggah bukti dukung</DialogTitle>
            <DialogDescription>
              {isUploading
                ? 'Jangan tutup jendela ini sampai unggahan selesai.'
                : 'Unggahan selesai.'}
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-3">
            {uploads.map((item) => (
              <li key={item.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {item.status === 'done'
                      ? 'Selesai'
                      : item.status === 'error'
                        ? 'Gagal'
                        : item.status === 'pending'
                          ? 'Menunggu'
                          : `${item.progress}%`}
                  </span>
                </div>
                <Progress
                  value={item.status === 'done' ? 100 : item.progress}
                  aria-label={`Progres unggah ${item.name}`}
                />
                {item.message ? <p className="text-destructive text-xs">{item.message}</p> : null}
              </li>
            ))}
          </ul>

          <DialogFooter>
            <Button onClick={() => setUploadOpen(false)} disabled={isUploading}>
              {isUploading ? 'Mengunggah…' : 'Tutup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{preview?.originalName}</DialogTitle>
          </DialogHeader>

          {previewBlob.isPending ? (
            <Skeleton className="h-[60vh] sm:h-[75vh] w-full" />
          ) : previewBlob.isError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertDescription>{getErrorMessage(previewBlob.error)}</AlertDescription>
            </Alert>
          ) : previewUrl && preview ? (
            preview.mimeType === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                title={preview.originalName}
                className="bg-muted h-[60vh] sm:h-[75vh] w-full rounded-lg border"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={preview.originalName}
                className="bg-muted max-h-[60vh] w-full rounded-lg object-contain sm:max-h-[75vh]"
              />
            )
          ) : null}

          {preview ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => void handleDownload(preview)}>
                <DownloadIcon />
                Unduh
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus bukti dukung?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.originalName} akan dihapus permanen dari kegiatan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={remove.isPending} onClick={handleDelete}>
              {remove.isPending ? 'Menghapus…' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
