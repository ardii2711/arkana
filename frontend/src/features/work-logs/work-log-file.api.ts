import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_WORK_LOG = 10;
export const MAX_TOTAL_BYTES_PER_WORK_LOG = 50 * 1024 * 1024;
export const ALLOWED_FILE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'heic',
  'heif',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
];
export const FILE_ACCEPT = ALLOWED_FILE_EXTENSIONS.map((extension) => `.${extension}`).join(',');

export type WorkLogFile = {
  id: string;
  workLogId: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  previewable: boolean;
};

export function fileExtension(name: string) {
  return /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toUpperCase() ?? 'FILE';
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function isAllowedFile(file: File) {
  const extension = fileExtension(file.name).toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.includes(extension);
}

export async function fetchWorkLogFiles(workLogId: string): Promise<WorkLogFile[]> {
  const { data } = await api.get<ApiSuccess<{ files: WorkLogFile[] }>>(
    `/work-logs/${workLogId}/files`,
  );
  return data.data.files;
}

export async function uploadWorkLogFile(
  workLogId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<WorkLogFile> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<ApiSuccess<{ file: WorkLogFile }>>(
    `/work-logs/${workLogId}/files`,
    formData,
    {
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    },
  );

  return data.data.file;
}

export async function deleteWorkLogFile(workLogId: string, fileId: string): Promise<void> {
  await api.delete(`/work-logs/${workLogId}/files/${fileId}`);
}

export async function fetchWorkLogFileBlob(
  workLogId: string,
  fileId: string,
  inline = false,
): Promise<Blob> {
  const { data } = await api.get<Blob>(`/work-logs/${workLogId}/files/${fileId}/content`, {
    params: inline ? { inline: 'true' } : undefined,
    responseType: 'blob',
  });

  return data;
}

export async function downloadWorkLogFile(workLogId: string, file: WorkLogFile) {
  const blob = await fetchWorkLogFileBlob(workLogId, file.id);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = file.originalName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  // Beri waktu browser memulai unduhan sebelum blob dilepas.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
