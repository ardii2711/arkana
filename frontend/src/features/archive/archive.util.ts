import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import type { ArchiveFolder } from './archive.api';

export type FolderNode = {
  folder: ArchiveFolder;
  depth: number;
  children: FolderNode[];
};

export function buildFolderTree(folders: ArchiveFolder[]): FolderNode[] {
  const byParent = new Map<string | null, ArchiveFolder[]>();

  for (const folder of folders) {
    byParent.set(folder.parentId, [...(byParent.get(folder.parentId) ?? []), folder]);
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }

  function walk(parentId: string | null, depth: number): FolderNode[] {
    return (byParent.get(parentId) ?? []).map((folder) => ({
      folder,
      depth,
      children: walk(folder.id, depth + 1),
    }));
  }

  return walk(null, 0);
}

export function flattenFolders(nodes: FolderNode[]): FolderNode[] {
  return nodes.flatMap((node) => [node, ...flattenFolders(node.children)]);
}

export function descendantIds(folders: ArchiveFolder[], folderId: string): string[] {
  return folders
    .filter((folder) => folder.parentId === folderId)
    .flatMap((folder) => [folder.id, ...descendantIds(folders, folder.id)]);
}

export function formatDocumentDate(value: string) {
  return format(parseISO(value), 'd MMM yyyy', { locale: localeId });
}
