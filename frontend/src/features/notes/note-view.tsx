'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  NotebookPenIcon,
  PinIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import type { Note } from './note.api';
import { NoteCard } from './note-card';
import { NoteEditorDialog } from './note-editor-dialog';
import { useNotes } from './use-notes';

const PAGE_SIZE = 20;

export function NoteView() {
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  const query = useNotes({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    pinned: pinnedOnly ? 'true' : undefined,
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = query.data?.items ?? [];
  const hasFilters = search !== '' || pinnedOnly;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchDraft.trim());
    setPage(1);
  }

  function togglePinned() {
    setPinnedOnly((value) => !value);
    setPage(1);
  }

  function resetFilters() {
    setSearch('');
    setSearchDraft('');
    setPinnedOnly(false);
    setPage(1);
  }

  function openForm(note: Note | null) {
    setEditing(note);
    setFormOpen(true);
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Catatan</h1>
          <p className="text-muted-foreground text-sm">
            Catatan pribadi, ide, dan hal yang perlu ditindaklanjuti.
          </p>
        </div>
        <Button onClick={() => openForm(null)}>Catatan baru</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={submitSearch} className="min-w-48 flex-1 sm:max-w-sm">
          <InputGroup>
            <InputGroupInput
              value={searchDraft}
              maxLength={100}
              placeholder="Cari isi catatan"
              aria-label="Cari isi catatan"
              onChange={(event) => setSearchDraft(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" size="icon-xs" aria-label="Cari catatan">
                <SearchIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>

        <Button
          variant={pinnedOnly ? 'default' : 'outline'}
          aria-pressed={pinnedOnly}
          onClick={togglePinned}
        >
          <PinIcon fill={pinnedOnly ? 'currentColor' : 'none'} />
          Disematkan
        </Button>

        {hasFilters ? (
          <Button variant="ghost" size="icon" aria-label="Reset filter" onClick={resetFilters}>
            <XIcon />
          </Button>
        ) : null}
      </div>

      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full" />
          ))}
        </div>
      ) : null}

      {query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(query.error)}{' '}
            <button type="button" className="underline" onClick={() => query.refetch()}>
              Coba lagi
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!query.isPending && !query.isError && items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <NotebookPenIcon className="text-muted-foreground size-8" />
          <p className="font-medium">
            {page > 1 || hasFilters
              ? page > 1
                ? 'Tidak ada catatan di halaman ini'
                : 'Tidak ada catatan yang cocok'
              : 'Belum ada catatan'}
          </p>
          <p className="text-muted-foreground text-sm">
            {page > 1
              ? 'Kembali ke halaman sebelumnya.'
              : hasFilters
                ? 'Ubah kata kunci atau filter.'
                : 'Tulis catatan pertama Anda untuk mulai merekam ide.'}
          </p>
          {page > 1 ? (
            <Button variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Halaman sebelumnya
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((note) => (
          <NoteCard key={note.id} note={note} onEdit={openForm} />
        ))}
      </div>

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            Halaman {page} dari {totalPages} · {total} catatan
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Halaman sebelumnya"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Halaman berikutnya"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      ) : null}

      {formOpen ? (
        <NoteEditorDialog
          note={editing}
          onOpenChange={(open) => {
            setFormOpen(open);

            if (!open) {
              setEditing(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
