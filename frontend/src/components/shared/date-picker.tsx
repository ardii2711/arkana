'use client';

import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { CalendarIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
};

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  clearable = false,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  const label = selected ? format(selected, 'd MMM yyyy', { locale: localeId }) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!label}
          className="w-full justify-start font-normal data-[empty=true]:text-muted-foreground"
        >
          <CalendarIcon />
          <span className="truncate">{label ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={localeId}
          defaultMonth={selected}
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, 'yyyy-MM-dd') : '');
            setOpen(false);
          }}
        />
        {clearable && label ? (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              <XIcon />
              Hapus tanggal
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
