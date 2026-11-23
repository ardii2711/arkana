'use client';

import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NAME_MAX_LENGTH } from '@/lib/limits';
import { addDaysWita, currentWitaDate } from '@/lib/wita';
import {
  SCHEDULE_STATUSES,
  SCHEDULE_STATUS_LABELS,
  type Schedule,
  type ScheduleStatus,
} from './schedule.api';
import { ScheduleFormDialog } from './schedule-form-dialog';
import { ScheduleList } from './schedule-list';
import { useSchedules } from './use-schedules';

const PAGE_SIZE = 20;
const DAY_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

type ScheduleFilters = {
  search: string;
  status: ScheduleStatus | 'ALL';
};

function parseFilters(params: URLSearchParams): ScheduleFilters {
  const status = params.get('status');

  return {
    search: params.get('q')?.trim() ?? '',
    status: SCHEDULE_STATUSES.includes(status as ScheduleStatus)
      ? (status as ScheduleStatus)
      : 'ALL',
  };
}

function parsePage(params: URLSearchParams) {
  const page = Number(params.get('page'));

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function toSearch(filters: ScheduleFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.search) params.set('q', filters.search);
  if (filters.status !== 'ALL') params.set('status', filters.status);
  if (page > 1) params.set('page', String(page));

  const query = params.toString();

  return query ? `/agenda?${query}` : '/agenda';
}

export function ScheduleView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = currentWitaDate();
  const filters = parseFilters(searchParams);
  const page = parsePage(searchParams);
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const searchTimer = useRef<number | undefined>(undefined);

  const searchActive = filters.search !== '';
  const status = filters.status === 'ALL' ? undefined : filters.status;

  const todayQuery = useSchedules(
    { page: 1, limit: DAY_LIMIT, from: today, to: today, status },
    !searchActive,
  );
  const listQuery = useSchedules(
    searchActive
      ? { page, limit: PAGE_SIZE, status, search: filters.search }
      : { page, limit: PAGE_SIZE, from: addDaysWita(today, 1), status },
  );

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, total);

  function navigate(next: ScheduleFilters, nextPage = 1) {
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

  function openForm(schedule: Schedule | null) {
    setEditing(schedule);
    setFormOpen(true);
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground text-sm">
            Jadwal kegiatan dan agenda pribadi. Waktu WITA (Asia/Makassar).
          </p>
        </div>
        <Button onClick={() => openForm(null)}>
          <PlusIcon />
          Tambah agenda
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
            placeholder="Cari judul, deskripsi, atau tempat"
            aria-label="Cari agenda"
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

        <Select
          value={filters.status}
          onValueChange={(value) =>
            navigate({ ...filters, status: value as ScheduleFilters['status'] })
          }
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter status agenda">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua status</SelectItem>
            {SCHEDULE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {SCHEDULE_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {searchActive ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">Hasil pencarian</h2>
            <p className="text-muted-foreground text-sm">Semua tanggal · {total} agenda</p>
          </div>
          <ScheduleList
            schedules={listQuery.data?.items ?? []}
            isLoading={listQuery.isPending}
            isError={listQuery.isError}
            error={listQuery.error}
            hasSearch
            showDate
            onRetry={() => listQuery.refetch()}
            onAdd={() => openForm(null)}
            onEdit={openForm}
            onClearSearch={() => changeSearch('')}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            firstItem={firstItem}
            lastItem={lastItem}
            total={total}
            disabled={listQuery.isFetching}
            onChange={(nextPage) => navigate(filters, nextPage)}
          />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Hari ini</h2>
            <ScheduleList
              schedules={todayQuery.data?.items ?? []}
              isLoading={todayQuery.isPending}
              isError={todayQuery.isError}
              error={todayQuery.error}
              hasSearch={false}
              emptyText="Tidak ada agenda hari ini."
              onRetry={() => todayQuery.refetch()}
              onAdd={() => openForm(null)}
              onEdit={openForm}
              onClearSearch={() => changeSearch('')}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold">Mendatang</h2>
            <ScheduleList
              schedules={listQuery.data?.items ?? []}
              isLoading={listQuery.isPending}
              isError={listQuery.isError}
              error={listQuery.error}
              hasSearch={false}
              showDate
              onRetry={() => listQuery.refetch()}
              onAdd={() => openForm(null)}
              onEdit={openForm}
              onClearSearch={() => changeSearch('')}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              firstItem={firstItem}
              lastItem={lastItem}
              total={total}
              disabled={listQuery.isFetching}
              onChange={(nextPage) => navigate(filters, nextPage)}
            />
          </section>
        </>
      )}

      {formOpen ? (
        <ScheduleFormDialog
          schedule={editing}
          defaultDate={today}
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

type PaginationProps = {
  page: number;
  totalPages: number;
  firstItem: number;
  lastItem: number;
  total: number;
  disabled: boolean;
  onChange: (page: number) => void;
};

function Pagination({
  page,
  totalPages,
  firstItem,
  lastItem,
  total,
  disabled,
  onChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        Menampilkan {firstItem}–{lastItem} dari {total} agenda
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label="Halaman sebelumnya"
          disabled={page <= 1 || disabled}
          onClick={() => onChange(page - 1)}
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
          disabled={page >= totalPages || disabled}
          onClick={() => onChange(page + 1)}
        >
          Berikutnya
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
