'use client';

import {
  ChevronRightIcon,
  FolderIcon,
  FolderPlusIcon,
  InboxIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import type { ArchiveFolder } from './archive.api';
import { ArchiveFolderDialog } from './archive-folder-dialog';
import { buildFolderTree, folderPath, type FolderNode } from './archive.util';
import { useDeleteArchiveFolder } from './use-archive';

type ArchiveFolderPanelProps = {
  folders: ArchiveFolder[];
  isLoading: boolean;
  selected?: string;
  onSelect: (folderId?: string) => void;
};

export function ArchiveFolderPanel({
  folders,
  isLoading,
  selected,
  onSelect,
}: ArchiveFolderPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ArchiveFolder | null>(null);
  const [deleting, setDeleting] = useState<ArchiveFolder | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const remove = useDeleteArchiveFolder();
  const tree = buildFolderTree(folders);
  // Folder leluhur dari folder aktif selalu terbuka agar posisi terpilih terlihat.
  const autoOpen = new Set(
    folderPath(folders, selected)
      .slice(0, -1)
      .map((folder) => folder.id),
  );

  const deletingHasChildren = deleting
    ? folders.some((folder) => folder.parentId === deleting.id)
    : false;
  const deletingIsEmpty = deleting ? !deletingHasChildren && deleting.fileCount === 0 : true;

  function isOpen(folderId: string) {
    return (expanded.has(folderId) || autoOpen.has(folderId)) && !collapsed.has(folderId);
  }

  function toggle(folderId: string) {
    if (isOpen(folderId)) {
      setExpanded((current) => {
        const next = new Set(current);
        next.delete(folderId);
        return next;
      });
      setCollapsed((current) => new Set(current).add(folderId));
      return;
    }

    setCollapsed((current) => {
      const next = new Set(current);
      next.delete(folderId);
      return next;
    });
    setExpanded((current) => new Set(current).add(folderId));
  }

  function handleDelete() {
    if (!deleting) return;

    remove.mutate(
      { id: deleting.id, recursive: !deletingIsEmpty },
      {
        onSuccess: () => {
          toast.success('Folder dihapus.');
          if (selected === deleting.id) onSelect(undefined);
          setDeleting(null);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <aside className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Folder</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Folder baru"
          onClick={() => setCreateOpen(true)}
        >
          <FolderPlusIcon />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <nav aria-label="Folder arsip">
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => onSelect(undefined)}
                aria-current={selected === undefined ? 'true' : undefined}
                className={cn(
                  'hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  selected === undefined && 'bg-muted font-medium',
                )}
              >
                <InboxIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">Semua dokumen</span>
              </button>
            </li>
            {tree.map((node) => (
              <FolderRow
                key={node.folder.id}
                node={node}
                selected={selected}
                isOpen={isOpen}
                onToggle={toggle}
                onSelect={onSelect}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </ul>
        </nav>
      )}

      {createOpen ? (
        <ArchiveFolderDialog
          folders={folders}
          folder={null}
          defaultParentId={selected ?? null}
          onOpenChange={setCreateOpen}
        />
      ) : null}

      {editing ? (
        <ArchiveFolderDialog
          folders={folders}
          folder={editing}
          defaultParentId={null}
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
            <AlertDialogTitle>Hapus folder?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingIsEmpty
                ? `${deleting?.name} akan dihapus.`
                : `${deleting?.name} berisi ${deleting?.fileCount ?? 0} dokumen dan subfolder. Semua isinya akan dihapus permanen.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={remove.isPending} onClick={handleDelete}>
              {remove.isPending ? 'Menghapus…' : deletingIsEmpty ? 'Hapus' : 'Hapus beserta isinya'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}

type FolderRowProps = {
  node: FolderNode;
  selected?: string;
  isOpen: (folderId: string) => boolean;
  onToggle: (folderId: string) => void;
  onSelect: (folderId?: string) => void;
  onEdit: (folder: ArchiveFolder) => void;
  onDelete: (folder: ArchiveFolder) => void;
};

function FolderRow({
  node,
  selected,
  isOpen,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
}: FolderRowProps) {
  const folder = node.folder;
  const isSelected = selected === folder.id;
  const hasChildren = node.children.length > 0;
  const open = hasChildren && isOpen(folder.id);

  return (
    <li>
      <div className="group flex items-center gap-0.5">
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={open ? `Tutup subfolder ${folder.name}` : `Buka subfolder ${folder.name}`}
            aria-expanded={open}
            aria-controls={`folder-children-${folder.id}`}
            onClick={() => onToggle(folder.id)}
            className="text-muted-foreground shrink-0"
          >
            <ChevronRightIcon
              aria-hidden="true"
              className={cn('transition-transform', open && 'rotate-90')}
            />
          </Button>
        ) : (
          <span className="size-6 shrink-0" aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={() => onSelect(folder.id)}
          aria-current={isSelected ? 'true' : undefined}
          className={cn(
            'hover:bg-muted flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            isSelected && 'bg-muted font-medium',
          )}
        >
          <FolderIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate">{folder.name}</span>
          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {folder.fileCount}
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Aksi folder ${folder.name}`}
              className="text-muted-foreground shrink-0 opacity-100 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(folder)}>
              <PencilIcon />
              Ubah
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(folder)}>
              <Trash2Icon />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {open ? (
        <ul id={`folder-children-${folder.id}`} className="ml-3 space-y-0.5 border-l pl-1">
          {node.children.map((child) => (
            <FolderRow
              key={child.folder.id}
              node={child}
              selected={selected}
              isOpen={isOpen}
              onToggle={onToggle}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
