'use client';

import { UploadIcon, TriangleAlertIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  parseArchiveFilters,
  parseArchivePage,
  toArchiveSearch,
  type ArchiveFilters,
} from './archive.util';
import { useArchiveFolders } from './use-archive';

export function ArchiveView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseArchiveFilters(searchParams);
  const page = parseArchivePage(searchParams);
  const query = useArchiveFolders();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderSheetOpen, setFolderSheetOpen] = useState(false);

  const folders = query.data?.folders ?? [];
  const usage = query.data?.usage;
  const remainingBytes = usage ? usage.quotaBytes - usage.usedBytes : 0;
  const usedPercent = usage ? Math.min(100, (usage.usedBytes / usage.quotaBytes) * 100) : 0;
  const defaultFolderId = filters.folder ?? null;

  function navigate(next: ArchiveFilters, nextPage = 1) {
    router.replace(toArchiveSearch(next, nextPage), { scroll: false });
  }

  function changeFolder(folder?: string) {
    navigate({ ...filters, folder });
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Arsip</h1>
          <p className="text-muted-foreground text-sm">
            Simpan dan kelola dokumen pribadi dalam folder terstruktur.
          </p>
          {usage ? (
            <div className="flex items-center gap-2 pt-1">
              <Progress
                value={usedPercent}
                className="h-1.5 w-28"
                aria-label="Pemakaian kuota arsip"
              />
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatFileSize(usage.usedBytes)} dari {formatFileSize(usage.quotaBytes)}
              </span>
            </div>
          ) : null}
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
              selected={filters.folder}
              onSelect={changeFolder}
            />
          </div>

          <div className="min-w-0">
            <ArchiveFiles
              folders={folders}
              filters={filters}
              page={page}
              onNavigate={navigate}
              onOpenFolders={() => setFolderSheetOpen(true)}
              onUpload={() => setUploadOpen(true)}
            />
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
              selected={filters.folder}
              onSelect={(folder) => {
                changeFolder(folder);
                setFolderSheetOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {uploadOpen ? (
        <ArchiveFileUploadDialog
          folders={folders}
          defaultFolderId={defaultFolderId}
          remainingBytes={remainingBytes}
          onOpenChange={setUploadOpen}
        />
      ) : null}
    </div>
  );
}
