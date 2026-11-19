'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createArchiveFolder,
  deleteArchiveFile,
  deleteArchiveFolder,
  fetchArchiveFileBlob,
  fetchArchiveFiles,
  fetchArchiveFolders,
  updateArchiveFile,
  updateArchiveFolder,
  uploadArchiveFile,
  type ArchiveFileParams,
  type ArchiveFileUpdateInput,
  type ArchiveFileUploadInput,
} from './archive.api';

const rootKey = ['archive'] as const;

export function useArchiveFolders() {
  return useQuery({
    queryKey: [...rootKey, 'folders'],
    queryFn: fetchArchiveFolders,
  });
}

export function useArchiveFiles(params: ArchiveFileParams) {
  return useQuery({
    queryKey: [...rootKey, 'files', params],
    queryFn: () => fetchArchiveFiles(params),
    placeholderData: keepPreviousData,
  });
}

export function useArchiveFileBlob(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [...rootKey, 'blob', id],
    queryFn: () => fetchArchiveFileBlob(id, true),
    enabled: enabled && id !== '',
    staleTime: Infinity,
    retry: false,
  });
}

export function useCreateArchiveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createArchiveFolder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useUpdateArchiveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { name?: string; parentId?: string | null };
    }) => updateArchiveFolder(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useDeleteArchiveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, recursive }: { id: string; recursive: boolean }) =>
      deleteArchiveFolder(id, recursive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useUploadArchiveFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      onProgress,
      signal,
    }: {
      input: ArchiveFileUploadInput;
      onProgress?: (percent: number) => void;
      signal?: AbortSignal;
    }) => uploadArchiveFile(input, { onProgress, signal }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useUpdateArchiveFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ArchiveFileUpdateInput }) =>
      updateArchiveFile(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useDeleteArchiveFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteArchiveFile(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: [...rootKey, 'blob', id] });
      return queryClient.invalidateQueries({ queryKey: rootKey });
    },
  });
}
