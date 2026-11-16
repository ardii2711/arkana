import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';

export type Note = {
  id: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoteInput = {
  content: string;
  pinned?: boolean;
};

export type NoteUpdateInput = {
  content?: string;
  pinned?: boolean;
};

export type NoteListParams = {
  page: number;
  limit: number;
  search?: string;
  pinned?: 'true' | 'false';
};

export type NoteList = {
  items: Note[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchNotes(params: NoteListParams): Promise<NoteList> {
  const { data } = await api.get<ApiSuccess<NoteList>>('/notes', {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      pinned: params.pinned,
    },
  });

  return data.data;
}

export async function createNote(input: NoteInput): Promise<Note> {
  const { data } = await api.post<ApiSuccess<{ note: Note }>>('/notes', input);

  return data.data.note;
}

export async function updateNote(id: string, input: NoteUpdateInput): Promise<Note> {
  const { data } = await api.patch<ApiSuccess<{ note: Note }>>(`/notes/${id}`, input);

  return data.data.note;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`);
}
