'use client';

import { DownloadIcon, PencilIcon, TriangleAlertIcon } from 'lucide-react';
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
import { useObjectUrl } from '@/hooks/use-object-url';
import { getErrorMessage } from '@/lib/api-error';
import { formatDate, formatDateTime } from '@/lib/date';
import { fileExtension, formatFileSize } from '@/lib/file-format';
import { downloadArchiveFile, type ArchiveFile, type ArchiveFolder } from './archive.api';
import { folderPathLabel } from './archive.util';
import { useArchiveFileBlob } from './use-archive';

type ArchiveFileDetailProps = {
  file: ArchiveFile | null;
  folders: ArchiveFolder[];
  onOpenChange: (open: boolean) => void;
  onEdit: (file: ArchiveFile) => void;
};

export function ArchiveFileDetail({ file, folders, onOpenChange, onEdit }: ArchiveFileDetailProps) {
  const blob = useArchiveFileBlob(file?.id ?? '', file?.previewable ?? false);
  const url = useObjectUrl(blob.data);

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
                <dt className="text-muted-foreground text-xs">Tanggal dokumen</dt>
                <dd>{file.documentDate ? formatDate(file.documentDate) : '-'}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-muted-foreground text-xs">Diunggah</dt>
                <dd>{formatDateTime(file.createdAt)}</dd>
              </div>
              <div className="col-span-2 space-y-0.5 sm:col-span-4">
                <dt className="text-muted-foreground text-xs">Folder</dt>
                <dd className="truncate">{folderPathLabel(folders, file.folderId)}</dd>
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
            ) : (
              <div className="bg-muted/40 flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
                <p className="font-medium">Pratinjau tidak tersedia</p>
                <p className="text-muted-foreground text-sm">
                  Format {fileExtension(file.originalName)} perlu diunduh untuk dibuka.
                </p>
                <Button variant="outline" onClick={() => void handleDownload()}>
                  <DownloadIcon />
                  Unduh dokumen
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {file ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => onEdit(file)}>
              <PencilIcon />
              Ubah
            </Button>
            <Button onClick={() => void handleDownload()}>
              <DownloadIcon />
              Unduh
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
