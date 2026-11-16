'use client';

import {
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
import { buildFolderTree, type FolderNode } from './archive.util';
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
  const remove = useDeleteArchiveFolder();
  const tree = buildFolderTree(folders);

  const deletingHasChildren = deleting
    ? folders.some((folder) => folder.parentId === deleting.id)
    : false;
  const deletingIsEmpty = deleting ? !deletingHasChildren && deleting.fileCount === 0 : true;

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
                  'hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  selected === undefined && 'bg-muted font-medium',
                )}
              >
                <InboxIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">Semua dokumen</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelect('root')}
                aria-current={selected === 'root' ? 'true' : undefined}
                className={cn(
                  'hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  selected === 'root' && 'bg-muted font-medium',
                )}
              >
                <FolderIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">Tanpa folder</span>
              </button>
            </li>
            {tree.map((node) => (
              <FolderRow
                key={node.folder.id}
                node={node}
                selected={selected}
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
          defaultParentId={selected && selected !== 'root' ? selected : null}
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
  onSelect: (folderId?: string) => void;
  onEdit: (folder: ArchiveFolder) => void;
  onDelete: (folder: ArchiveFolder) => void;
};

function FolderRow({ node, selected, onSelect, onEdit, onDelete }: FolderRowProps) {
  const isSelected = selected === node.folder.id;

  return (
    <li>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onSelect(node.folder.id)}
          aria-current={isSelected ? 'true' : undefined}
          className={cn(
            'hover:bg-muted flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pr-2 text-sm transition-colors',
            isSelected && 'bg-muted font-medium',
          )}
          style={{ paddingLeft: `${8 + node.depth * 14}px` }}
        >
          <FolderIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate">{node.folder.name}</span>
          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {node.folder.fileCount}
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Aksi folder ${node.folder.name}`}
              className="text-muted-foreground"
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(node.folder)}>
              <PencilIcon />
              Ubah
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(node.folder)}>
              <Trash2Icon />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {node.children.length > 0 ? (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <FolderRow
              key={child.folder.id}
              node={child}
              selected={selected}
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
