'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
  type NoteInput,
  type NoteListParams,
  type NoteUpdateInput,
} from './note.api';

const rootKey = ['notes'] as const;

export function useNotes(params: NoteListParams) {
  return useQuery({
    queryKey: [...rootKey, 'list', params],
    queryFn: () => fetchNotes(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NoteInput) => createNote(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NoteUpdateInput) => updateNote(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useToggleNotePin(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pinned: boolean) => updateNote(id, { pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rootKey }),
  });
}
