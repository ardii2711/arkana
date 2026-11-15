'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteWorkLogFile,
  fetchWorkLogFileBlob,
  fetchWorkLogFiles,
  uploadWorkLogFile,
  type WorkLogFile,
} from './work-log-file.api';

function filesKey(workLogId: string) {
  return ['work-logs', 'files', workLogId] as const;
}

export function useWorkLogFiles(workLogId: string) {
  return useQuery({
    queryKey: filesKey(workLogId),
    queryFn: () => fetchWorkLogFiles(workLogId),
  });
}

export function useWorkLogFileBlob(workLogId: string, fileId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...filesKey(workLogId), 'blob', fileId],
    queryFn: () => fetchWorkLogFileBlob(workLogId, fileId, true),
    enabled: enabled && fileId !== '',
    staleTime: Infinity,
    retry: false,
  });
}

export function useUploadWorkLogFile(workLogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) =>
      uploadWorkLogFile(workLogId, file, onProgress),
    onSuccess: (file: WorkLogFile) => {
      queryClient.setQueryData<WorkLogFile[]>(filesKey(workLogId), (files = []) => [
        ...files,
        file,
      ]);
    },
  });
}

export function useDeleteWorkLogFile(workLogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => deleteWorkLogFile(workLogId, fileId),
    onSuccess: (_result, fileId) => {
      queryClient.setQueryData<WorkLogFile[]>(filesKey(workLogId), (files = []) =>
        files.filter((file) => file.id !== fileId),
      );
    },
  });
}
