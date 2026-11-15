export interface FolderNode {
  id: string;
  parentId: string | null;
}

export const MAX_FOLDER_LEVEL = 3;

function childrenMap(folders: FolderNode[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const folder of folders) {
    if (folder.parentId) {
      map.set(folder.parentId, [...(map.get(folder.parentId) ?? []), folder.id]);
    }
  }

  return map;
}

export function folderLevel(folders: FolderNode[], folderId: string | null): number | null {
  let level = 0;
  let current = folderId;

  while (current) {
    const folder = folders.find((item) => item.id === current);

    if (!folder) {
      return null;
    }

    level += 1;
    current = folder.parentId;
  }

  return level;
}

export function descendantIds(folders: FolderNode[], folderId: string): string[] {
  const children = childrenMap(folders);
  const ids: string[] = [];
  const queue = [folderId];

  while (queue.length > 0) {
    const current = queue.pop() as string;
    ids.push(current);
    queue.push(...(children.get(current) ?? []));
  }

  return ids;
}

export function subtreeHeight(folders: FolderNode[], folderId: string): number {
  const children = childrenMap(folders);

  const height = (id: string): number =>
    1 + Math.max(0, ...(children.get(id) ?? []).map((childId) => height(childId)));

  return height(folderId);
}
