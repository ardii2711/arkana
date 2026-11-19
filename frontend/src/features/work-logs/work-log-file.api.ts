import { api } from '@/lib/api';
import { downloadBlob } from '@/lib/download';
import type { ApiSuccess } from '@/types/api';

export type WorkLogFile = {
  id: string;
  workLogId: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  previewable: boolean;
};

export async function fetchWorkLogFiles(workLogId: string): Promise<WorkLogFile[]> {
  const { data } = await api.get<ApiSuccess<{ files: WorkLogFile[] }>>(
    `/work-logs/${workLogId}/files`,
  );
  return data.data.files;
}

export async function uploadWorkLogFile(
  workLogId: string,
  file: File,
  options: { signal?: AbortSignal; onProgress?: (percent: number) => void } = {},
): Promise<WorkLogFile> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<ApiSuccess<{ file: WorkLogFile }>>(
    `/work-logs/${workLogId}/files`,
    formData,
    {
      signal: options.signal,
      onUploadProgress: (event) => {
        if (!options.onProgress || !event.total) return;
        options.onProgress(Math.round((event.loaded / event.total) * 100));
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
  downloadBlob(await fetchWorkLogFileBlob(workLogId, file.id), file.originalName);
}
