'use client';

import { DownloadIcon, EyeIcon, TriangleAlertIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { WORK_CATEGORY_LABELS } from './work-log.api';
import { FileTypeIcon } from './work-log-file-icon';
import { downloadBlob, fileExtension, formatFileSize, type WorkLogFile } from './work-log-file.api';
import { formatActivityDate } from './work-log.format';
import { fetchPublicWorkLogFileBlob } from './work-log-public.api';
import { usePublicWorkLog, usePublicWorkLogFileBlob } from './use-work-log-public';

export function WorkLogPublicView({ token }: { token: string }) {
  const query = usePublicWorkLog(token);
  const [preview, setPreview] = useState<WorkLogFile | null>(null);

  const previewBlob = usePublicWorkLogFileBlob(token, preview?.id ?? '', preview !== null);
  const previewUrl = useMemo(
    () => (previewBlob.data ? URL.createObjectURL(previewBlob.data) : null),
    [previewBlob.data],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleDownload(file: WorkLogFile) {
    try {
      downloadBlob(await fetchPublicWorkLogFileBlob(token, file.id), file.originalName);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 space-y-1">
        <p className="font-heading text-lg font-semibold tracking-tight">ARKANA</p>
        <p className="text-muted-foreground text-sm">Bukti dukung kegiatan</p>
      </header>

      {query.isPending ? (
        <div className="space-y-6" aria-busy="true" aria-label="Memuat bukti dukung">
          <div className="space-y-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : query.isError ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>
              {getErrorMessage(query.error)} Tautan mungkin salah atau kegiatan sudah tidak
              tersedia.
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => query.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {query.data.name}
            </h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">{WORK_CATEGORY_LABELS[query.data.category]}</Badge>
              <time dateTime={query.data.activityDate}>
                {formatActivityDate(query.data.activityDate)}
              </time>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-6">
              <section className="space-y-2">
                <h2 className="text-sm font-medium">Uraian pekerjaan</h2>
                <p className="text-sm whitespace-pre-line">{query.data.description}</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-medium">Hasil atau output</h2>
                <p className="text-sm whitespace-pre-line">{query.data.output}</p>
              </section>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold tracking-tight">Bukti dukung</h2>

            {query.data.files.length === 0 ? (
              <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
                Belum ada bukti dukung pada kegiatan ini.
              </p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {query.data.files.map((file) => (
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
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{preview?.originalName}</DialogTitle>
            <DialogDescription>Pratinjau bukti dukung.</DialogDescription>
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
    </main>
  );
}
