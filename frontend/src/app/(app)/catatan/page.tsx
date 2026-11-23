import type { Metadata } from 'next';
import { Suspense } from 'react';

import { NoteView } from '@/features/notes/note-view';

export const metadata: Metadata = {
  title: 'Catatan',
};

export default function NotesPage() {
  return (
    <Suspense>
      <NoteView />
    </Suspense>
  );
}
