'use client';

import { FolderTreeIcon, TriangleAlertIcon, UploadIcon } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getErrorMessage } from '@/lib/api-error';
import { formatFileSize } from '@/lib/file-format';
import { ArchiveFileUploadDialog } from './archive-file-upload-dialog';
import { ArchiveFiles } from './archive-files';
import { ArchiveFolderPanel } from './archive-folder-panel';
import { useArchiveFolders } from './use-archive';

export function ArchiveView() {
  const query = useArchiveFolders();
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderSheetOpen, setFolderSheetOpen] = useState(false);

  const folders = query.data?.folders ?? [];
  const usage = query.data?.usage;
  const remainingBytes = usage ? usage.quotaBytes - usage.usedBytes : 0;
  const usedPercent = usage ? Math.min(100, (usage.usedBytes / usage.quotaBytes) * 100) : 0;
  const currentFolderName =
    folderId === undefined
      ? 'Semua dokumen'
      : folderId === 'root'
        ? 'Tanpa folder'
        : (folders.find((folder) => folder.id === folderId)?.name ?? 'Folder');

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Arsip</h1>
          <p className="text-muted-foreground text-sm">
            Simpan dan kelola dokumen pribadi dalam folder terstruktur.
          </p>
        </div>
        <Button
          onClick={() => setUploadOpen(true)}
          disabled={!usage || remainingBytes <= 0}
          title={usage && remainingBytes <= 0 ? 'Kuota arsip sudah penuh' : undefined}
        >
          <UploadIcon />
          Unggah dokumen
        </Button>
      </div>

      {usage ? (
        <div className="space-y-2 rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">Penyimpanan arsip</span>
            <span className="text-muted-foreground tabular-nums">
              {formatFileSize(usage.usedBytes)} dari {formatFileSize(usage.quotaBytes)}
            </span>
          </div>
          <Progress value={usedPercent} aria-label="Pemakaian kuota arsip" />
        </div>
      ) : null}

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
      ) : (
        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <ArchiveFolderPanel
              folders={folders}
              isLoading={query.isPending}
              selected={folderId}
              onSelect={setFolderId}
            />
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-2 lg:hidden">
              <Button variant="outline" onClick={() => setFolderSheetOpen(true)}>
                <FolderTreeIcon />
                Folder
              </Button>
              <span className="text-muted-foreground min-w-0 truncate text-sm">
                {currentFolderName}
              </span>
            </div>

            <ArchiveFiles folders={folders} folderId={folderId} onFolderChange={setFolderId} />
          </div>
        </div>
      )}

      <Sheet open={folderSheetOpen} onOpenChange={setFolderSheetOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Folder</SheetTitle>
            <SheetDescription>Pilih folder atau kelola strukturnya.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <ArchiveFolderPanel
              folders={folders}
              isLoading={query.isPending}
              selected={folderId}
              onSelect={(id) => {
                setFolderId(id);
                setFolderSheetOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {uploadOpen ? (
        <ArchiveFileUploadDialog
          folders={folders}
          defaultFolderId={folderId && folderId !== 'root' ? folderId : null}
          remainingBytes={remainingBytes}
          onOpenChange={setUploadOpen}
        />
      ) : null}
    </div>
  );
}
