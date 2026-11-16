import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';
import type { WorkCategory } from './work-log.api';
import type { WorkLogFile } from './work-log-file.api';

export type PublicWorkLog = {
  name: string;
  activityDate: string;
  category: WorkCategory;
  description: string;
  output: string;
  files: WorkLogFile[];
};

export async function fetchPublicWorkLog(token: string): Promise<PublicWorkLog> {
  const { data } = await api.get<ApiSuccess<{ workLog: PublicWorkLog }>>(
    `/public/work-logs/${encodeURIComponent(token)}`,
  );

  return data.data.workLog;
}

export async function fetchPublicWorkLogFileBlob(
  token: string,
  fileId: string,
  inline = false,
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/public/work-logs/${encodeURIComponent(token)}/files/${encodeURIComponent(fileId)}/content`,
    {
      params: inline ? { inline: 'true' } : undefined,
      responseType: 'blob',
    },
  );

  return data;
}
