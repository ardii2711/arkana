'use client';

import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';

type ScheduleCalendarProps = {
  selected: string;
  onSelect: (value: string) => void;
  onMonthChange: (value: string) => void;
  bookedDates: string[];
};

function visibleMonth(step: Date) {
  const year = step.getFullYear();

  return `${year}-${String(step.getMonth() + 1).padStart(2, '0')}-01`;
}

export function ScheduleCalendar({
  selected,
  onSelect,
  onMonthChange,
  bookedDates,
}: ScheduleCalendarProps) {
  return (
    <Calendar
      mode="single"
      locale={localeId}
      selected={parseISO(selected)}
      defaultMonth={parseISO(selected)}
      onSelect={(date) => date && onSelect(format(date, 'yyyy-MM-dd'))}
      onMonthChange={(month) => onMonthChange(visibleMonth(month))}
      modifiers={{ booked: bookedDates.map((date) => parseISO(date)) }}
      modifiersClassNames={{ booked: 'font-bold text-primary' }}
      className="w-full"
    />
  );
}
