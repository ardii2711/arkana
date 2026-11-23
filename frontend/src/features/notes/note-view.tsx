'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  NotebookPenIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api-error';
import { NAME_MAX_LENGTH } from '@/lib/limits';
import type { Note } from './note.api';
import { NoteCard } from './note-card';
import { NoteEditorDialog } from './note-editor-dialog';
import { useNotes } from './use-notes';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type NoteFilters = {
  search: string;
  pinned: boolean;
};

function parseFilters(params: URLSearchParams): NoteFilters {
  return {
    search: params.get('q')?.trim() ?? '',
    pinned: params.get('sematkan') === '1',
  };
}

function parsePage(params: URLSearchParams) {
  const page = Number(params.get('page'));

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function toSearch(filters: NoteFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.search) params.set('q', filters.search);
  if (filters.pinned) params.set('sematkan', '1');
  if (page > 1) params.set('page', String(page));

  const query = params.toString();

  return query ? `/catatan?${query}` : '/catatan';
}

export function NoteView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseFilters(searchParams);
  const page = parsePage(searchParams);
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const searchTimer = useRef<number | undefined>(undefined);

  const query = useNotes({
    page,
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    pinned: filters.pinned ? 'true' : undefined,
  });

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = query.data?.items ?? [];
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, total);
  const hasFilters = filters.search !== '' || filters.pinned;
  const outOfRange = !query.isPending && page > totalPages;

  useEffect(() => {
    if (outOfRange) {
      router.replace(toSearch(filters, totalPages), { scroll: false });
    }
  }, [filters, outOfRange, router, totalPages]);

  function navigate(next: NoteFilters, nextPage = 1) {
    router.replace(toSearch(next, nextPage), { scroll: false });
  }

  function changeSearch(value: string) {
    setSearchDraft(value);
    window.clearTimeout(searchTimer.current);

    if (value.trim() === filters.search) return;

    if (value.trim() === '') {
      navigate({ ...filters, search: '' });
      return;
    }

    searchTimer.current = window.setTimeout(() => {
      navigate({ ...filters, search: value.trim() });
    }, SEARCH_DEBOUNCE_MS);
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
        <Button onClick={() => openForm(null)}>
          <PlusIcon />
          Catatan baru
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <InputGroup className="w-full sm:max-w-sm">
          <InputGroupAddon align="inline-start">
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            value={searchDraft}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Cari isi catatan"
            aria-label="Cari isi catatan"
            onChange={(event) => changeSearch(event.target.value)}
          />
          {searchDraft ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label="Hapus pencarian"
                onClick={() => changeSearch('')}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        <Button
          variant={filters.pinned ? 'default' : 'outline'}
          aria-pressed={filters.pinned}
          onClick={() => navigate({ ...filters, pinned: !filters.pinned })}
        >
          <PinIcon fill={filters.pinned ? 'currentColor' : 'none'} />
          Disematkan
        </Button>
      </div>

      {query.isError ? (
        <div className="space-y-3">
          <Alert variant="destructive">
            <AlertDescription>{getErrorMessage(query.error)}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => query.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : query.isPending || outOfRange ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border border-dashed ring-0">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
              {hasFilters ? (
                <SearchIcon aria-hidden="true" className="size-5" />
              ) : (
                <NotebookPenIcon aria-hidden="true" className="size-5" />
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                {hasFilters ? 'Tidak ada catatan yang cocok' : 'Belum ada catatan'}
              </p>
              <p className="text-muted-foreground max-w-sm text-sm">
                {filters.search
                  ? filters.pinned
                    ? 'Tidak ada catatan disematkan yang memuat kata kunci tersebut.'
                    : 'Tidak ada isi catatan yang memuat kata kunci tersebut.'
                  : 'Belum ada catatan yang disematkan.'}
              </p>
            </div>
            {hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchDraft('');
                  navigate({ search: '', pinned: false });
                }}
              >
                Hapus filter
              </Button>
            ) : (
              <Button onClick={() => openForm(null)}>
                <PlusIcon />
                Tulis catatan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((note) => (
            <NoteCard key={note.id} note={note} onEdit={openForm} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Menampilkan {firstItem}–{lastItem} dari {total} catatan
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Halaman sebelumnya"
              disabled={page <= 1 || query.isFetching}
              onClick={() => navigate(filters, page - 1)}
            >
              <ChevronLeftIcon />
              Sebelumnya
            </Button>
            <span className="text-muted-foreground text-sm tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              aria-label="Halaman berikutnya"
              disabled={page >= totalPages || query.isFetching}
              onClick={() => navigate(filters, page + 1)}
            >
              Berikutnya
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
