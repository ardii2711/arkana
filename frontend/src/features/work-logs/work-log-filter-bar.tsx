'use client';

import { SearchIcon, XIcon } from 'lucide-react';

import { DateRangePicker } from '@/components/shared/date-range-picker';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
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
import { WORK_CATEGORIES, WORK_CATEGORY_LABELS, type WorkCategory } from './work-log.api';

export type WorkLogFilters = {
  search: string;
  category: WorkCategory | 'ALL';
  from: string;
  to: string;
};

export const EMPTY_WORK_LOG_FILTERS: WorkLogFilters = {
  search: '',
  category: 'ALL',
  from: '',
  to: '',
};

type WorkLogFilterBarProps = {
  value: WorkLogFilters;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSubmitSearch: () => void;
  onChange: (patch: Partial<WorkLogFilters>) => void;
  onReset: () => void;
};

export function WorkLogFilterBar({
  value,
  searchDraft,
  onSearchDraftChange,
  onSubmitSearch,
  onChange,
  onReset,
}: WorkLogFilterBarProps) {
  const hasFilters =
    value.search !== '' || value.category !== 'ALL' || value.from !== '' || value.to !== '';

  return (
    <form
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-12 xl:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmitSearch();
      }}
    >
      <Field className="xl:col-span-4">
        <FieldLabel htmlFor="work-log-search">Cari kegiatan</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="work-log-search"
            value={searchDraft}
            maxLength={100}
            placeholder="Nama atau uraian kegiatan"
            onChange={(event) => onSearchDraftChange(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" size="icon-xs" aria-label="Cari kegiatan">
              <SearchIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field className="xl:col-span-3">
        <FieldLabel htmlFor="work-log-category">Kategori</FieldLabel>
        <Select
          value={value.category}
          onValueChange={(next) => onChange({ category: next as WorkCategory | 'ALL' })}
        >
          <SelectTrigger id="work-log-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua kategori</SelectItem>
            {WORK_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {WORK_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field className="xl:col-span-3">
        <FieldLabel htmlFor="work-log-date-range">Rentang tanggal</FieldLabel>
        <DateRangePicker
          id="work-log-date-range"
          value={{ from: value.from, to: value.to }}
          onChange={(range) => onChange({ from: range.from, to: range.to })}
        />
      </Field>

      <div className="flex items-end xl:col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Reset filter"
          disabled={!hasFilters}
          onClick={onReset}
        >
          <XIcon />
        </Button>
      </div>
    </form>
  );
}
