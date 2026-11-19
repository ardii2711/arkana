'use client';

import {
  CameraIcon,
  CheckIcon,
  Loader2Icon,
  RotateCcwIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadCloudIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { FileTypeIcon } from '@/components/shared/file-type-icon';
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
import { Progress } from '@/components/ui/progress';
import { useObjectUrl } from '@/hooks/use-object-url';
import { toApiError } from '@/lib/api-error';
import { fileExtension, formatFileSize, isAllowedFile } from '@/lib/file-format';
import { cn } from '@/lib/utils';

export type UploadRequest = {
  signal: AbortSignal;
  onProgress: (percent: number) => void;
};

type FileUploadDialogProps = {
  files: File[];
  accept: string;
  maxFileBytes: number;
  remainingSlots: number;
  remainingBytes: number;
  title: string;
  upload: (file: File, request: UploadRequest) => Promise<unknown>;
  onFinished?: (result: { uploaded: number; failed: number }) => void;
  onClose: () => void;
};

type Status = 'waiting' | 'uploading' | 'done' | 'error' | 'cancelled';

type QueueItem = {
  key: string;
  file: File;
  status: Status;
  progress: number;
  error?: string;
};

const PREVIEWABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const RETRY_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canRetry(error: unknown) {
  const status = toApiError(error).status;

  return status === null || status >= 500;
}

function Thumb({ file }: { file: File }) {
  const url = useObjectUrl(PREVIEWABLE_TYPES.includes(file.type) ? file : undefined);

  if (!url) {
    return (
      <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md [&_svg]:size-4">
        <FileTypeIcon mimeType={file.type} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="size-10 shrink-0 rounded-md object-cover" />
  );
}

export function FileUploadDialog({
  files,
  accept,
  maxFileBytes,
  remainingSlots,
  remainingBytes,
  title,
  upload,
  onFinished,
  onClose,
}: FileUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [selection, setSelection] = useState<File[]>(files);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [phase, setPhase] = useState<'select' | 'uploading' | 'finished'>('select');
  const [runCount, setRunCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const validation = selection.reduce<{ errors: (string | null)[]; slots: number; bytes: number }>(
    (state, file) => {
      let error: string | null = null;
      let slots = state.slots;
      let bytes = state.bytes;

      if (!isAllowedFile(file)) {
        error = 'Format tidak didukung';
      } else if (file.size > maxFileBytes) {
        error = `Melebihi ${formatFileSize(maxFileBytes)}`;
      } else if (slots <= 0) {
        error = 'Slot file habis';
      } else if (file.size > bytes) {
        error = `Melebihi sisa ${formatFileSize(bytes)}`;
      } else {
        slots -= 1;
        bytes -= file.size;
      }

      return { errors: [...state.errors, error], slots, bytes };
    },
    { errors: [], slots: remainingSlots, bytes: remainingBytes },
  );
  const selectionErrors = validation.errors;
  const invalid = selectionErrors.some((error) => error !== null);

  const done = items.filter((item) => item.status === 'done').length;
  const failed = items.filter((item) => item.status === 'error').length;
  const active = items.filter((item) => item.status !== 'cancelled');
  const totalBytes = active.reduce((total, item) => total + item.file.size, 0);
  const loadedBytes = active.reduce(
    (total, item) =>
      total + (item.status === 'done' ? item.file.size : item.file.size * (item.progress / 100)),
    0,
  );
  const overall = totalBytes === 0 ? 0 : Math.round((loadedBytes / totalBytes) * 100);

  function patch(key: string, changes: Partial<QueueItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...changes } : item)),
    );
  }

  function addFiles(incoming: FileList | File[] | null) {
    if (!incoming) return;

    const list = Array.from(incoming);
    if (list.length === 0) return;

    setSelection((current) => [...current, ...list]);
  }

  function removeFile(index: number) {
    setSelection((current) => current.filter((_, position) => position !== index));
  }

  async function attempt(file: File, key: string, signal: AbortSignal) {
    for (let run = 0; run < 2; run += 1) {
      try {
        await upload(file, {
          signal,
          onProgress: (progress) => patch(key, { progress }),
        });

        return { ok: true as const };
      } catch (error) {
        if (signal.aborted) return { ok: false as const, aborted: true as const };
        if (run === 1 || !canRetry(error)) {
          return { ok: false as const, message: toApiError(error).message };
        }

        await sleep(RETRY_DELAY_MS);
        if (signal.aborted) return { ok: false as const, aborted: true as const };
      }
    }

    return { ok: false as const, message: 'Unggahan gagal.' };
  }

  async function runUpload(targets: QueueItem[]) {
    const controller = new AbortController();
    controllerRef.current = controller;
    setRunCount(targets.length);
    setPhase('uploading');

    let uploaded = 0;
    let failedCount = 0;

    for (const target of targets) {
      if (controller.signal.aborted) {
        patch(target.key, { status: 'cancelled' });
        continue;
      }

      patch(target.key, { status: 'uploading', progress: 0, error: undefined });

      const result = await attempt(target.file, target.key, controller.signal);

      if (result.ok) {
        uploaded += 1;
        patch(target.key, { status: 'done', progress: 100 });
      } else if (result.aborted) {
        patch(target.key, { status: 'cancelled' });
      } else {
        failedCount += 1;
        patch(target.key, { status: 'error', error: result.message });
      }
    }

    controllerRef.current = null;
    setPhase('finished');
    onFinished?.({ uploaded, failed: failedCount });
  }

  function startUpload() {
    const queue = selection.map((file) => ({
      key: crypto.randomUUID(),
      file,
      status: 'waiting' as const,
      progress: 0,
    }));

    setItems(queue);
    void runUpload(queue);
  }

  function retry(itemsToRetry: QueueItem[]) {
    setItems((current) =>
      current.map((item) =>
        itemsToRetry.some((target) => target.key === item.key)
          ? { ...item, status: 'waiting', progress: 0, error: undefined }
          : item,
      ),
    );
    void runUpload(itemsToRetry);
  }

  function requestClose() {
    if (phase === 'uploading') {
      setCancelOpen(true);
      return;
    }

    onClose();
  }

  function confirmCancel() {
    setCancelOpen(false);
    controllerRef.current?.abort();
  }

  function uploadAgain() {
    setSelection([]);
    setItems([]);
    setPhase('select');
  }

  const failedItems = items.filter((item) => item.status === 'error');
  const formats = accept
    .split(',')
    .map((extension) => extension.replace('.', '').toUpperCase())
    .join(', ');
  const heading =
    phase === 'select'
      ? title
      : phase === 'uploading'
        ? `Mengunggah ${runCount} file`
        : failed > 0
          ? 'Sebagian unggahan gagal'
          : 'Unggahan selesai';

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{heading}</DialogTitle>
            <DialogDescription aria-live="polite">
              {phase === 'select'
                ? `Sisa ${remainingSlots} slot · ${formatFileSize(remainingBytes)} tersedia.`
                : phase === 'uploading'
                  ? `${done} selesai · ${failed} gagal · ${formatFileSize(loadedBytes)} dari ${formatFileSize(totalBytes)}.`
                  : `${done} file berhasil${failed > 0 ? ` · ${failed} gagal` : ''}.`}
            </DialogDescription>
          </DialogHeader>

          {phase === 'select' ? (
            <div className="space-y-3">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  addFiles(event.dataTransfer.files);
                }}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center',
                  dragging && 'bg-muted/60 border-primary',
                )}
              >
                <UploadCloudIcon aria-hidden="true" className="text-muted-foreground size-5" />
                <p className="text-sm">Tarik file ke sini atau</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    Pilih file
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="sm:hidden"
                    onClick={() => cameraRef.current?.click()}
                  >
                    <CameraIcon aria-hidden="true" />
                    Ambil foto
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  {formats} · maks {formatFileSize(maxFileBytes)} per file
                </p>
              </div>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept={accept}
                className="sr-only"
                aria-label="Pilih file"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = '';
                }}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                aria-label="Ambil foto"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = '';
                }}
              />

              {selection.length > 0 ? (
                <ul className="max-h-[45vh] divide-y overflow-y-auto rounded-xl border">
                  {selection.map((file, index) => {
                    const error = selectionErrors[index];

                    return (
                      <li
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className="flex items-center gap-3 p-3"
                      >
                        <Thumb file={file} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {fileExtension(file.name)} · {formatFileSize(file.size)}
                          </p>
                          {error ? <p className="text-destructive text-xs">{error}</p> : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Hapus ${file.name}`}
                          onClick={() => removeFile(index)}
                        >
                          <Trash2Icon />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Belum ada file dipilih. Tambahkan file untuk diunggah.
                </p>
              )}

              {invalid ? (
                <p className="text-destructive text-xs">
                  Hapus file yang bertanda merah untuk melanjutkan.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <Progress value={overall} aria-label="Progres unggahan keseluruhan" />

              <ul className="max-h-[45vh] divide-y overflow-y-auto rounded-xl border">
                {items.map((item) => (
                  <li key={item.key} className="flex items-center gap-3 p-3">
                    <Thumb file={item.file} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.file.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {fileExtension(item.file.name)} · {formatFileSize(item.file.size)}
                      </p>
                      {item.status === 'uploading' ? (
                        <Progress
                          value={item.progress}
                          aria-label={`Progres ${item.file.name}`}
                          className="mt-1.5 h-1"
                        />
                      ) : null}
                      {item.status === 'error' && item.error ? (
                        <p className="text-destructive text-xs">{item.error}</p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {item.status === 'waiting' ? (
                        <span className="text-muted-foreground text-xs">Menunggu</span>
                      ) : null}
                      {item.status === 'uploading' ? (
                        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs tabular-nums">
                          <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
                          {item.progress}%
                        </span>
                      ) : null}
                      {item.status === 'done' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckIcon aria-hidden="true" className="size-3.5" />
                          Selesai
                        </span>
                      ) : null}
                      {item.status === 'cancelled' ? (
                        <span className="text-muted-foreground text-xs">Dibatalkan</span>
                      ) : null}
                      {item.status === 'error' ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={phase === 'uploading'}
                          onClick={() => retry([item])}
                        >
                          <RotateCcwIcon aria-hidden="true" />
                          Ulangi
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>

              {failed > 0 && failedItems.length > 1 && phase === 'finished' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => retry(failedItems)}
                >
                  <TriangleAlertIcon aria-hidden="true" />
                  Ulangi semua yang gagal
                </Button>
              ) : null}
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            {phase === 'select' ? (
              <>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Batal
                </Button>
                <Button
                  type="button"
                  disabled={selection.length === 0 || invalid}
                  onClick={startUpload}
                >
                  Unggah {selection.length} file
                </Button>
              </>
            ) : phase === 'uploading' ? (
              <>
                <span className="text-muted-foreground text-xs sm:mr-auto">
                  File yang sudah selesai tetap tersimpan.
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setCancelOpen(true)}
                >
                  Batalkan unggahan
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={uploadAgain}>
                  Unggah lagi
                </Button>
                <Button type="button" onClick={onClose}>
                  Tutup
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan unggahan?</AlertDialogTitle>
            <AlertDialogDescription>
              File yang sudah selesai tetap tersimpan. File yang belum terkirim akan dibatalkan dan
              perlu dipilih ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Lanjutkan unggah</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Batalkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
