import { api } from '@/lib/api';
import { downloadBlob } from '@/lib/download';
import type { ApiSuccess } from '@/types/api';

export type ArchiveFolder = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
};

export type ArchiveUsage = {
  usedBytes: number;
  quotaBytes: number;
};

export type ArchiveFolders = {
  folders: ArchiveFolder[];
  usage: ArchiveUsage;
};

export type ArchiveFile = {
  id: string;
  folderId: string | null;
  folderName: string | null;
  name: string;
  description: string | null;
  documentDate: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  previewable: boolean;
};

export type ArchiveFileType = 'image' | 'pdf' | 'document';

export type ArchiveFileParams = {
  folderId?: string;
  search?: string;
  type?: ArchiveFileType;
  page: number;
  limit: number;
};

export type ArchiveFileList = {
  items: ArchiveFile[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchArchiveFolders(): Promise<ArchiveFolders> {
  const { data } = await api.get<ApiSuccess<ArchiveFolders>>('/archive/folders');
  return data.data;
}

export async function createArchiveFolder(input: { name: string; parentId: string | null }) {
  const { data } = await api.post<ApiSuccess<{ folder: ArchiveFolder }>>('/archive/folders', input);
  return data.data.folder;
}

export async function updateArchiveFolder(
  id: string,
  input: { name?: string; parentId?: string | null },
) {
  const { data } = await api.patch<ApiSuccess<{ folder: ArchiveFolder }>>(
    `/archive/folders/${id}`,
    input,
  );
  return data.data.folder;
}

export async function deleteArchiveFolder(id: string, recursive: boolean): Promise<void> {
  await api.delete(`/archive/folders/${id}`, {
    params: recursive ? { recursive: 'true' } : undefined,
  });
}

export async function fetchArchiveFiles(params: ArchiveFileParams): Promise<ArchiveFileList> {
  const { data } = await api.get<ApiSuccess<ArchiveFileList>>('/archive/files', {
    params: {
      folderId: params.folderId || undefined,
      search: params.search || undefined,
      type: params.type || undefined,
      page: params.page,
      limit: params.limit,
    },
  });
  return data.data;
}

export type ArchiveFileUploadInput = {
  file: File;
  folderId?: string | null;
  name?: string;
  description?: string;
  documentDate?: string;
};

export type ArchiveUploadOptions = {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export async function uploadArchiveFile(
  input: ArchiveFileUploadInput,
  options: ArchiveUploadOptions = {},
): Promise<ArchiveFile> {
  const formData = new FormData();
  formData.append('file', input.file);
  if (input.folderId) formData.append('folderId', input.folderId);
  if (input.name) formData.append('name', input.name);
  if (input.description) formData.append('description', input.description);
  if (input.documentDate) formData.append('documentDate', input.documentDate);

  const { data } = await api.post<ApiSuccess<{ file: ArchiveFile }>>('/archive/files', formData, {
    signal: options.signal,
    onUploadProgress: (event) => {
      if (!options.onProgress || !event.total) return;
      options.onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });

  return data.data.file;
}

export type ArchiveFileUpdateInput = {
  name: string;
  description: string | null;
  documentDate: string | null;
  folderId: string | null;
};

export async function updateArchiveFile(
  id: string,
  input: ArchiveFileUpdateInput,
): Promise<ArchiveFile> {
  const { data } = await api.patch<ApiSuccess<{ file: ArchiveFile }>>(
    `/archive/files/${id}`,
    input,
  );
  return data.data.file;
}

export async function deleteArchiveFile(id: string): Promise<void> {
  await api.delete(`/archive/files/${id}`);
}

export async function fetchArchiveFileBlob(id: string, inline = false): Promise<Blob> {
  const { data } = await api.get<Blob>(`/archive/files/${id}/content`, {
    params: inline ? { inline: 'true' } : undefined,
    responseType: 'blob',
  });

  return data;
}

export async function downloadArchiveFile(file: ArchiveFile) {
  downloadBlob(await fetchArchiveFileBlob(file.id), file.originalName);
}
