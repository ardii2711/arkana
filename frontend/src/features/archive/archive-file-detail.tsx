'use client';

import { DownloadIcon, TriangleAlertIcon } from 'lucide-react';
import { useEffect, useMemo } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { fileExtension, formatFileSize } from '@/lib/file-format';
import { downloadArchiveFile, type ArchiveFile } from './archive.api';
import { formatDocumentDate } from './archive.util';
import { useArchiveFileBlob } from './use-archive';

type ArchiveFileDetailProps = {
  file: ArchiveFile | null;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveFileDetail({ file, onOpenChange }: ArchiveFileDetailProps) {
  const blob = useArchiveFileBlob(file?.id ?? '', file?.previewable ?? false);
  const url = useMemo(() => (blob.data ? URL.createObjectURL(blob.data) : null), [blob.data]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  async function handleDownload() {
    if (!file) return;

    try {
      await downloadArchiveFile(file);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={file !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{file?.name}</DialogTitle>
          <DialogDescription className="truncate">{file?.originalName}</DialogDescription>
        </DialogHeader>

        {file ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="space-y-0.5">
                <dt className="text-muted-foreground text-xs">Jenis</dt>
                <dd>{fileExtension(file.originalName)}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-muted-foreground text-xs">Ukuran</dt>
                <dd>{formatFileSize(file.size)}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-muted-foreground text-xs">Folder</dt>
                <dd className="truncate">{file.folderName ?? 'Tanpa folder'}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-muted-foreground text-xs">Tanggal dokumen</dt>
                <dd>{file.documentDate ? formatDocumentDate(file.documentDate) : '-'}</dd>
              </div>
            </dl>

            {file.description ? (
              <p className="text-sm whitespace-pre-line">{file.description}</p>
            ) : null}

            {file.previewable ? (
              blob.isPending ? (
                <Skeleton className="h-[45vh] w-full sm:h-[60vh]" />
              ) : blob.isError ? (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertDescription>{getErrorMessage(blob.error)}</AlertDescription>
                </Alert>
              ) : url ? (
                file.mimeType === 'application/pdf' ? (
                  <iframe
                    src={url}
                    title={file.name}
                    className="bg-muted h-[45vh] w-full rounded-lg border sm:h-[60vh]"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={file.name}
                    className="bg-muted max-h-[45vh] w-full rounded-lg object-contain sm:max-h-[60vh]"
                  />
                )
              ) : null
            ) : null}
          </div>
        ) : null}

        {file ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => void handleDownload()}>
              <DownloadIcon />
              Unduh
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
