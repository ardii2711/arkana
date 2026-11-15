'use client';

import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

export type DateRangeValue = {
  from: string;
  to: string;
};

type DateRangePickerProps = {
  id?: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
};

function toDate(value: string) {
  return parseISO(value);
}

function formatLabel(value: DateRangeValue) {
  if (!value.from) return null;

  const start = format(toDate(value.from), 'd MMM yyyy', { locale: localeId });
  if (!value.to) return start;

  return `${start} – ${format(toDate(value.to), 'd MMM yyyy', { locale: localeId })}`;
}

export function DateRangePicker({ id, value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const label = formatLabel(value);
  const selected: DateRange | undefined = value.from
    ? { from: toDate(value.from), to: value.to ? toDate(value.to) : undefined }
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-empty={!label}
          className="w-full justify-start font-normal data-[empty=true]:text-muted-foreground"
        >
          <CalendarIcon />
          <span className="truncate">{label ?? 'Pilih rentang tanggal'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          locale={localeId}
          defaultMonth={selected?.from}
          selected={selected}
          numberOfMonths={isMobile ? 1 : 2}
          onSelect={(range) => {
            onChange({
              from: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
              to: range?.to ? format(range.to, 'yyyy-MM-dd') : '',
            });

            if (range?.from && range.to) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
