'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { NAME_MAX_LENGTH } from '@/lib/limits';
import { fileExtension, formatFileSize } from '@/lib/file-format';
import {
  downloadArchiveFile,
  type ArchiveFile,
  type ArchiveFileType,
  type ArchiveFolder,
  type ArchiveSort,
} from './archive.api';
import { ArchiveFileDetail } from './archive-file-detail';
import { ArchiveFileEditDialog } from './archive-file-edit-dialog';
import { formatDate } from '@/lib/date';
import { buildFolderTree, flattenFolders } from './archive.util';
import { useArchiveFiles, useDeleteArchiveFile } from './use-archive';

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<ArchiveFileType, string> = {
  image: 'Gambar',
  pdf: 'PDF',
  document: 'Dokumen',
};

type ArchiveFilesProps = {
  folders: ArchiveFolder[];
  folderId?: string;
  onFolderChange: (folderId?: string) => void;
};

export function ArchiveFiles({ folders, folderId, onFolderChange }: ArchiveFilesProps) {
  const [type, setType] = useState<ArchiveFileType | 'ALL'>('ALL');
  const [sort, setSort] = useState<ArchiveSort>('recent');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ArchiveFile | null>(null);
  const [editing, setEditing] = useState<ArchiveFile | null>(null);
  const [deleting, setDeleting] = useState<ArchiveFile | null>(null);
  const remove = useDeleteArchiveFile();

  const query = useArchiveFiles({
    folderId,
    search,
    type: type === 'ALL' ? undefined : type,
    sort,
    page,
    limit: PAGE_SIZE,
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, total);
  const hasFilters = search !== '' || type !== 'ALL' || sort !== 'recent';
  const folderOptions = flattenFolders(buildFolderTree(folders));

  function resetFilters() {
    setType('ALL');
    setSort('recent');
    setSearch('');
    setSearchDraft('');
    setPage(1);
  }

  function handleDelete() {
    if (!deleting) return;

    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Dokumen dihapus.');
        if (page > 1 && query.data?.items.length === 1) setPage((current) => current - 1);
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
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchDraft.trim());
            setPage(1);
          }}
        >
          <Input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Cari nama atau deskripsi"
            aria-label="Cari dokumen"
            maxLength={NAME_MAX_LENGTH}
            className="min-w-0"
          />
          <Button type="submit" variant="outline" size="icon" aria-label="Cari dokumen">
            <SearchIcon />
          </Button>
        </form>

        <Select
          value={type}
          onValueChange={(value) => {
            setType(value as ArchiveFileType | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32" aria-label="Filter jenis berkas">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua jenis</SelectItem>
            {(Object.keys(TYPE_LABELS) as ArchiveFileType[]).map((value) => (
              <SelectItem key={value} value={value}>
                {TYPE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as ArchiveSort);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40" aria-label="Urutkan dokumen">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Terbaru diunggah</SelectItem>
            <SelectItem value="name">Nama dokumen</SelectItem>
            <SelectItem value="documentDate">Tanggal dokumen</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={folderId ?? 'all'}
          onValueChange={(value) => {
            onFolderChange(value === 'all' ? undefined : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:hidden" aria-label="Pilih folder">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua dokumen</SelectItem>
            <SelectItem value="root">Tanpa folder</SelectItem>
            {folderOptions.map((node) => (
              <SelectItem key={node.folder.id} value={node.folder.id}>
                {'— '.repeat(node.depth)}
                {node.folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        ) : null}
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
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
              <FolderOpenIcon aria-hidden="true" className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                {hasFilters || folderId ? 'Tidak ada dokumen di sini' : 'Arsip masih kosong'}
              </p>
              <p className="text-muted-foreground max-w-sm text-sm">
                {hasFilters || folderId
                  ? 'Ubah folder, kata kunci, atau filter untuk melihat dokumen lain.'
                  : 'Unggah dokumen pertama Anda untuk mulai mengarsipkan.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="divide-y rounded-xl border">
            {query.data.items.map((file) => (
              <li
                key={file.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <FileTypeIcon mimeType={file.mimeType} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {fileExtension(file.originalName)} · {formatFileSize(file.size)}
                      {file.folderName ? ` · ${file.folderName}` : ''}
                      {file.documentDate ? ` · ${formatDate(file.documentDate)}` : ''}
                    </p>
                    {file.description ? (
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {file.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Lihat ${file.name}`}
                    onClick={() => setDetail(file)}
                  >
                    <EyeIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Unduh ${file.name}`}
                    onClick={() => void handleDownload(file)}
                  >
                    <DownloadIcon />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Aksi lain untuk ${file.name}`}
                      >
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Menampilkan {firstItem}–{lastItem} dari {total} dokumen
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage((current) => current - 1)}
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
                onClick={() => setPage((current) => current + 1)}
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
        onOpenChange={(open) => {
          if (!open) setDetail(null);
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
              {deleting?.name} akan dihapus permanen dari arsip Anda.
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
