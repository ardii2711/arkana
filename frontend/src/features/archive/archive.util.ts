import type { ArchiveFileParams, ArchiveFileType, ArchiveFolder } from './archive.api';

export type FolderNode = {
  folder: ArchiveFolder;
  depth: number;
  children: FolderNode[];
};

export const ARCHIVE_PAGE_SIZE = 20;

/** Nilai sentinel pilihan "Arsip utama" (level root) pada Select folder. */
export const ARCHIVE_ROOT = 'root';

export const ARCHIVE_TYPES = ['image', 'pdf', 'document'] as const;

export const ARCHIVE_TYPE_LABELS: Record<ArchiveFileType, string> = {
  image: 'Gambar',
  pdf: 'PDF',
  document: 'Dokumen',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ArchiveFilters = {
  /** uuid folder, atau undefined (semua dokumen). */
  folder?: string;
  search: string;
  type: ArchiveFileType | 'ALL';
};

export function parseArchiveFilters(params: URLSearchParams): ArchiveFilters {
  const folder = params.get('folder');
  const type = ARCHIVE_TYPES.find((item) => item === params.get('jenis'));

  return {
    folder: folder && UUID_PATTERN.test(folder) ? folder : undefined,
    search: params.get('q') ?? '',
    type: type ?? 'ALL',
  };
}

export function parseArchivePage(params: URLSearchParams) {
  const page = Number(params.get('page') ?? '1');

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function toArchiveParams(filters: ArchiveFilters, page: number): ArchiveFileParams {
  return {
    folderId: filters.folder,
    search: filters.search || undefined,
    type: filters.type === 'ALL' ? undefined : filters.type,
    page,
    limit: ARCHIVE_PAGE_SIZE,
  };
}

export function toArchiveSearch(filters: ArchiveFilters, page = 1) {
  const params = new URLSearchParams();

  if (filters.folder) params.set('folder', filters.folder);
  if (filters.search) params.set('q', filters.search);
  if (filters.type !== 'ALL') params.set('jenis', filters.type);
  if (page > 1) params.set('page', String(page));

  const query = params.toString();

  return query ? `/arsip?${query}` : '/arsip';
}

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

/** Jalur folder dari akar sampai folder yang dipilih. */
export function folderPath(folders: ArchiveFolder[], folderId?: string): ArchiveFolder[] {
  if (!folderId) return [];

  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: ArchiveFolder[] = [];
  let current = byId.get(folderId);

  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path;
}

/** Nama jalur folder, mis. "SK & Kepegawaian / 2025". */
export function folderPathLabel(folders: ArchiveFolder[], folderId: string | null) {
  if (!folderId) return 'Arsip utama';

  const path = folderPath(folders, folderId);

  return path.length > 0 ? path.map((folder) => folder.name).join(' / ') : 'Arsip utama';
}
