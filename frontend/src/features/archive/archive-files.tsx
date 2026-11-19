'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FolderOpenIcon,
  FolderTreeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { FileTypeIcon } from '@/components/shared/file-type-icon';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/date';
import { NAME_MAX_LENGTH } from '@/lib/limits';
import { fileExtension, formatFileSize } from '@/lib/file-format';
import { cn } from '@/lib/utils';
import { downloadArchiveFile, type ArchiveFile, type ArchiveFolder } from './archive.api';
import { ArchiveFileDetail } from './archive-file-detail';
import { ArchiveFileEditDialog } from './archive-file-edit-dialog';
import {
  ARCHIVE_PAGE_SIZE,
  ARCHIVE_TYPE_LABELS,
  ARCHIVE_TYPES,
  folderPath,
  folderPathLabel,
  toArchiveParams,
  type ArchiveFilters,
} from './archive.util';
import { useArchiveFiles, useDeleteArchiveFile } from './use-archive';

const SEARCH_DEBOUNCE_MS = 300;

type ArchiveFilesProps = {
  folders: ArchiveFolder[];
  filters: ArchiveFilters;
  page: number;
  onNavigate: (filters: ArchiveFilters, page?: number) => void;
  onOpenFolders: () => void;
  onUpload: () => void;
};

export function ArchiveFiles({
  folders,
  filters,
  page,
  onNavigate,
  onOpenFolders,
  onUpload,
}: ArchiveFilesProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [detail, setDetail] = useState<ArchiveFile | null>(null);
  const [editing, setEditing] = useState<ArchiveFile | null>(null);
  const [deleting, setDeleting] = useState<ArchiveFile | null>(null);
  const searchTimer = useRef<number | undefined>(undefined);
  const remove = useDeleteArchiveFile();

  const query = useArchiveFiles(toArchiveParams(filters, page));

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
  const firstItem = total === 0 ? 0 : (page - 1) * ARCHIVE_PAGE_SIZE + 1;
  const lastItem = Math.min(page * ARCHIVE_PAGE_SIZE, total);
  const path = folderPath(folders, filters.folder);
  const hasSubfolders =
    filters.folder !== undefined && folders.some((folder) => folder.parentId === filters.folder);
  const state = emptyState(filters);

  function changeSearch(value: string) {
    setSearchDraft(value);
    window.clearTimeout(searchTimer.current);

    if (value.trim() === filters.search) return;

    if (value.trim() === '') {
      onNavigate({ ...filters, search: '' });
      return;
    }

    searchTimer.current = window.setTimeout(() => {
      onNavigate({ ...filters, search: value.trim() });
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleDelete() {
    if (!deleting) return;

    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Dokumen dihapus.');
        if (page > 1 && query.data?.items.length === 1) onNavigate(filters, page - 1);
        setDeleting(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  async function handleDownload(file: ArchiveFile) {
    try {
      await downloadArchiveFile(file);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={onOpenFolders}>
            <FolderTreeIcon />
            Folder
          </Button>
          <nav aria-label="Lokasi folder" className="min-w-0">
            <ol className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ ...filters, folder: undefined }, 1)}
                  aria-current={filters.folder === undefined ? 'page' : undefined}
                  className={cn(
                    'truncate rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50',
                    filters.folder === undefined ? 'font-medium' : 'text-muted-foreground',
                  )}
                >
                  Semua dokumen
                </button>
              </li>
              {path.map((folder, index) => (
                <li key={folder.id} className="flex min-w-0 items-center gap-1">
                  <span aria-hidden="true" className="text-muted-foreground">
                    /
                  </span>
                  {index === path.length - 1 ? (
                    <span aria-current="page" className="truncate font-medium">
                      {folder.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate({ ...filters, folder: folder.id }, 1)}
                      className="text-muted-foreground truncate rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {folder.name}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="archive-search" className="sr-only">
            Cari dokumen
          </label>
          <InputGroup className="w-full sm:w-64">
            <InputGroupAddon align="inline-start">
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="archive-search"
              value={searchDraft}
              maxLength={NAME_MAX_LENGTH}
              placeholder={filters.folder ? 'Cari di folder ini' : 'Cari nama atau deskripsi'}
              onChange={(event) => changeSearch(event.target.value)}
            />
            {searchDraft ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  aria-label="Hapus pencarian"
                  onClick={() => changeSearch('')}
                >
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>

          <Select
            value={filters.type}
            onValueChange={(value) =>
              onNavigate({ ...filters, type: value as ArchiveFilters['type'] }, 1)
            }
          >
            <SelectTrigger className="w-full sm:w-36" aria-label="Filter jenis berkas">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua jenis</SelectItem>
              {ARCHIVE_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {ARCHIVE_TYPE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <ul className="divide-y rounded-xl border" aria-busy="true" aria-label="Memuat dokumen">
          {[0, 1, 2, 3].map((row) => (
            <li key={row} className="flex items-center gap-3 p-4">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </li>
          ))}
        </ul>
      ) : total === 0 ? (
        <Card className="border border-dashed ring-0">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
              {state.search ? (
                <SearchIcon aria-hidden="true" className="size-5" />
              ) : (
                <FolderOpenIcon aria-hidden="true" className="size-5" />
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium">{state.title}</p>
              <p className="text-muted-foreground max-w-sm text-sm">{state.description}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {state.search ? (
                <Button variant="outline" onClick={() => changeSearch('')}>
                  Hapus pencarian
                </Button>
              ) : (
                <>
                  <Button onClick={onUpload}>
                    <UploadIcon />
                    Unggah dokumen
                  </Button>
                  {filters.folder || filters.type !== 'ALL' ? (
                    <Button
                      variant="outline"
                      onClick={() => onNavigate({ folder: undefined, search: '', type: 'ALL' }, 1)}
                    >
                      Lihat semua dokumen
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="divide-y overflow-hidden rounded-xl border">
            {query.data.items.map((file) => (
              <li key={file.id} className="group flex items-center gap-1 pr-1">
                <button
                  type="button"
                  onClick={() => setDetail(file)}
                  aria-label={`Lihat ${file.name}`}
                  className="hover:bg-muted/50 focus-visible:bg-muted/50 flex min-w-0 flex-1 items-start gap-3 rounded-lg p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                >
                  <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <FileTypeIcon mimeType={file.mimeType} />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block truncate text-sm font-medium">{file.name}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {fileExtension(file.originalName)} · {formatFileSize(file.size)}
                      {file.documentDate ? ` · ${formatDate(file.documentDate)}` : ''}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {folderPathLabel(folders, file.folderId)}
                    </span>
                    {file.description ? (
                      <span className="text-muted-foreground line-clamp-2 block text-xs">
                        {file.description}
                      </span>
                    ) : null}
                  </span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Aksi untuk ${file.name}`}
                      className="text-muted-foreground"
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => void handleDownload(file)}>
                      <DownloadIcon />
                      Unduh
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setEditing(file)}>
                      <PencilIcon />
                      Ubah
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(file)}>
                      <Trash2Icon />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Menampilkan {firstItem}–{lastItem} dari {total} dokumen
              {hasSubfolders ? ' (termasuk subfolder)' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || query.isFetching}
                onClick={() => onNavigate(filters, page - 1)}
              >
                <ChevronLeftIcon />
                Sebelumnya
              </Button>
              <span className="text-muted-foreground text-sm tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || query.isFetching}
                onClick={() => onNavigate(filters, page + 1)}
              >
                Berikutnya
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </>
      )}

      <ArchiveFileDetail
        file={detail}
        folders={folders}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        onEdit={(file) => {
          setDetail(null);
          setEditing(file);
        }}
      />

      {editing ? (
        <ArchiveFileEditDialog
          file={editing}
          folders={folders}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      ) : null}

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} ({formatFileSize(deleting?.size ?? 0)}) akan dihapus permanen dari
              arsip Anda. Tindakan ini tidak dapat dibatalkan.
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
    </div>
  );
}

function emptyState(filters: ArchiveFilters) {
  if (filters.search) {
    return {
      search: true,
      title: 'Tidak ada dokumen yang cocok',
      description: `Tidak ada nama atau deskripsi dokumen yang memuat "${filters.search}".`,
    };
  }

  if (filters.type !== 'ALL') {
    return {
      search: false,
      title: `Tidak ada dokumen ${ARCHIVE_TYPE_LABELS[filters.type].toLowerCase()}`,
      description: 'Ubah jenis berkas atau lihat seluruh dokumen di arsip.',
    };
  }

  if (filters.folder) {
    return {
      search: false,
      title: 'Folder ini masih kosong',
      description: 'Folder ini dan subfoldernya belum berisi dokumen.',
    };
  }

  return {
    search: false,
    title: 'Arsip masih kosong',
    description: 'Unggah dokumen pertama Anda untuk mulai mengarsipkan.',
  };
}
