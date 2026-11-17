'use client';

import { useMemo, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { formatDateLong } from '@/lib/date';
import { currentWitaDate, monthRangeWita, upcomingRangeWita, witaDatePart } from '@/lib/wita';
import { isScheduleOnDate, sortSchedules, witaBookedDates } from './schedule.format';
import type { Schedule } from './schedule.api';
import { ScheduleCalendar } from './schedule-calendar';
import { ScheduleFormDialog } from './schedule-form-dialog';
import { ScheduleList } from './schedule-list';
import { useSchedules } from './use-schedules';

type ListView = 'upcoming' | 'day';

export function ScheduleView() {
  const today = currentWitaDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [range, setRange] = useState(() => monthRangeWita(today));
  const [listView, setListView] = useState<ListView>('upcoming');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  // ponytail: satu bulan diambil sekaligus (limit 100); kalau melebihi, pecah jadi per-tanggal.
  const monthQuery = useSchedules({ page: 1, limit: 100, from: range.from, to: range.to });
  const upcoming = useMemo(() => upcomingRangeWita(today), [today]);
  // ponytail: "Mendatang" menampilkan 30 hari ke depan (limit 20); tanpa pagination belum dibangun.
  const upcomingQuery = useSchedules({ page: 1, limit: 20, from: upcoming.from, to: upcoming.to });

  const monthSchedules = useMemo(() => monthQuery.data?.items ?? [], [monthQuery.data]);
  const bookedDates = useMemo(() => witaBookedDates(monthSchedules), [monthSchedules]);
  const daySchedules = useMemo(
    () =>
      sortSchedules(monthSchedules.filter((schedule) => isScheduleOnDate(schedule, selectedDate))),
    [monthSchedules, selectedDate],
  );
  const upcomingSchedules = useMemo(
    () => sortSchedules(upcomingQuery.data?.items ?? []),
    [upcomingQuery.data],
  );

  const viewing = listView === 'upcoming' ? upcomingSchedules : daySchedules;
  const activeQuery = listView === 'upcoming' ? upcomingQuery : monthQuery;
  const dayTabLabel =
    selectedDate === today
      ? 'Hari ini'
      : new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Makassar',
          day: 'numeric',
          month: 'long',
        }).format(new Date(`${selectedDate}T00:00:00.000+08:00`));

  function openForm(schedule: Schedule | null) {
    setEditing(schedule);
    setFormOpen(true);
  }

  function handleSaved(schedule: Schedule) {
    const date = witaDatePart(schedule.startAt);

    setSelectedDate(date);
    setRange(monthRangeWita(date));
    setListView('day');
  }

  function changeView(next: ListView) {
    setListView(next);
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground text-sm">
          Jadwal kegiatan, tenggat waktu, dan agenda pribadi. Pengingat dan notifikasi menyusul.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        <Card className="self-start">
          <CardContent>
            <ScheduleCalendar
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setListView('day');
              }}
              onMonthChange={(month) => setRange(monthRangeWita(month))}
              bookedDates={bookedDates}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div
            role="tablist"
            aria-label="Tampilan daftar agenda"
            className="inline-flex rounded-lg border p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={listView === 'upcoming'}
              onClick={() => changeView('upcoming')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                listView === 'upcoming'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mendatang
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={listView === 'day'}
              onClick={() => changeView('day')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                listView === 'day'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {dayTabLabel}
            </button>
          </div>

          <ScheduleList
            title={listView === 'upcoming' ? 'Mendatang' : formatDateLong(selectedDate)}
            subtitle={listView === 'upcoming' ? '30 hari ke depan' : 'hari terpilih'}
            schedules={viewing}
            showDate={listView === 'upcoming'}
            isLoading={activeQuery.isPending}
            isError={activeQuery.isError}
            error={activeQuery.error}
            onRetry={() => activeQuery.refetch()}
            onAdd={() => openForm(null)}
            onEdit={openForm}
          />
        </div>
      </div>

      {formOpen ? (
        <ScheduleFormDialog
          schedule={editing}
          defaultDate={selectedDate}
          onOpenChange={(open) => {
            setFormOpen(open);

            if (!open) {
              setEditing(null);
            }
          }}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
