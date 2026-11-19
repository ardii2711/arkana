import type { Metadata } from 'next';

import { NoteView } from '@/features/notes/note-view';

export const metadata: Metadata = {
  title: 'Catatan',
};

export default function NotesPage() {
  return <NoteView />;
}
