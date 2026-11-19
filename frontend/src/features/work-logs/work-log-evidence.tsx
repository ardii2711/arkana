'use client';

import { DownloadIcon, EyeIcon, Trash2Icon, TriangleAlertIcon, UploadIcon } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUploadDialog, type UploadRequest } from '@/components/shared/file-upload-dialog';
import { useObjectUrl } from '@/hooks/use-object-url';
import { getErrorMessage } from '@/lib/api-error';
import { MAX_FILE_BYTES, MAX_FILES_PER_WORK_LOG, MAX_TOTAL_BYTES_PER_WORK_LOG } from '@/lib/limits';
import { FILE_ACCEPT, fileExtension, formatFileSize } from '@/lib/file-format';
import { downloadWorkLogFile, type WorkLogFile } from './work-log-file.api';
import { FileTypeIcon } from '@/components/shared/file-type-icon';
import {
  useDeleteWorkLogFile,
  useUploadWorkLogFile,
  useWorkLogFileBlob,
  useWorkLogFiles,
} from './use-work-log-files';

export function WorkLogEvidence({ workLogId }: { workLogId: string }) {
  const query = useWorkLogFiles(workLogId);
  const upload = useUploadWorkLogFile(workLogId);
  const remove = useDeleteWorkLogFile(workLogId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<WorkLogFile | null>(null);
  const [toDelete, setToDelete] = useState<WorkLogFile | null>(null);

  const files = query.data ?? [];
  const usedBytes = files.reduce((total, file) => total + file.size, 0);
  const slotsLeft = MAX_FILES_PER_WORK_LOG - files.length;
  const bytesLeft = MAX_TOTAL_BYTES_PER_WORK_LOG - usedBytes;

  const previewBlob = useWorkLogFileBlob(workLogId, preview?.id ?? '', preview !== null);
  const previewUrl = useObjectUrl(previewBlob.data);

  async function handleUpload(file: File, request: UploadRequest) {
    await upload.mutateAsync({ file, signal: request.signal, onProgress: request.onProgress });
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
            {formatFileSize(MAX_TOTAL_BYTES_PER_WORK_LOG)} · maks {formatFileSize(MAX_FILE_BYTES)}{' '}
            per file
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={slotsLeft <= 0}
          onClick={() => setUploadOpen(true)}
        >
          <UploadIcon />
          Unggah file
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

      {uploadOpen ? (
        <FileUploadDialog
          files={[]}
          accept={FILE_ACCEPT}
          maxFileBytes={MAX_FILE_BYTES}
          remainingSlots={slotsLeft}
          remainingBytes={bytesLeft}
          title="Unggah bukti dukung"
          upload={handleUpload}
          onFinished={({ uploaded }) => {
            if (uploaded > 0) toast.success(`${uploaded} file diunggah.`);
          }}
          onClose={() => setUploadOpen(false)}
        />
      ) : null}

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
