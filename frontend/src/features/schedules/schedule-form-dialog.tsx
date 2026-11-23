'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/api-error';
import { toWitaIso, witaDatePart, witaTimePart } from '@/lib/wita';
import { TITLE_MAX_LENGTH } from '@/lib/limits';
import {
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUSES,
  type Schedule,
  type ScheduleInput,
} from './schedule.api';
import { scheduleFormSchema, type ScheduleFormValues } from './schedule.schemas';
import { useCreateSchedule, useUpdateSchedule } from './use-schedules';

type ScheduleFormDialogProps = {
  schedule: Schedule | null;
  defaultDate: string;
  onOpenChange: (open: boolean) => void;
  onSaved?: (schedule: Schedule) => void;
};

export function ScheduleFormDialog({
  schedule,
  defaultDate,
  onOpenChange,
  onSaved,
}: ScheduleFormDialogProps) {
  const isEdit = schedule !== null;
  const create = useCreateSchedule();
  const update = useUpdateSchedule(schedule?.id ?? '');
  const mutation = isEdit ? update : create;
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: schedule?.title ?? '',
      description: schedule?.description ?? '',
      location: schedule?.location ?? '',
      status: schedule?.status ?? 'NOT_STARTED',
      allDay: schedule?.allDay ?? false,
      startDate: schedule ? witaDatePart(schedule.startAt) : defaultDate,
      startTime: schedule ? witaTimePart(schedule.startAt) : '08:00',
      endDate: schedule?.endAt ? witaDatePart(schedule.endAt) : '',
      endTime: schedule?.endAt ? witaTimePart(schedule.endAt) : '',
    },
  });

  const allDay = useWatch({ control: form.control, name: 'allDay' });

  function onSubmit(values: ScheduleFormValues) {
    setFormError(null);

    const input: ScheduleInput = {
      title: values.title,
      description: values.description || null,
      location: values.location || null,
      status: values.status,
      allDay: values.allDay,
      startAt: toWitaIso(values.startDate, values.allDay ? '00:00' : values.startTime),
      endAt:
        values.endDate || values.endTime
          ? toWitaIso(
              values.endDate || values.startDate,
              values.allDay ? '23:59' : values.endTime || '23:59',
            )
          : null,
    };

    mutation.mutate(input, {
      onSuccess: (saved) => {
        toast.success(isEdit ? 'Agenda diperbarui.' : 'Agenda disimpan.');
        onSaved?.(saved);
        onOpenChange(false);
      },
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah agenda' : 'Tambah agenda'}</DialogTitle>
          <DialogDescription>
            Waktu mengikuti WITA (Asia/Makassar). Tanpa pengulangan dan pengingat pada versi ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="schedule-title">Judul</FieldLabel>
              <Input
                id="schedule-title"
                maxLength={TITLE_MAX_LENGTH}
                autoFocus
                {...form.register('title')}
              />
              <FieldError
                errors={form.formState.errors.title ? [form.formState.errors.title] : undefined}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="schedule-description">Deskripsi (opsional)</FieldLabel>
              <Textarea
                id="schedule-description"
                rows={2}
                maxLength={2_000}
                {...form.register('description')}
              />
              <FieldError
                errors={
                  form.formState.errors.description
                    ? [form.formState.errors.description]
                    : undefined
                }
              />
            </Field>

            <Field>
              <label htmlFor="schedule-allday" className="flex items-center gap-2">
                <input
                  id="schedule-allday"
                  type="checkbox"
                  className="size-4 accent-primary"
                  {...form.register('allDay')}
                />
                <span className="text-sm font-medium">Sepanjang hari</span>
              </label>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="schedule-start-date">Tanggal mulai</FieldLabel>
                <Input id="schedule-start-date" type="date" {...form.register('startDate')} />
                <FieldError
                  errors={
                    form.formState.errors.startDate ? [form.formState.errors.startDate] : undefined
                  }
                />
              </Field>

              {!allDay ? (
                <Field>
                  <FieldLabel htmlFor="schedule-start-time">Waktu mulai (WITA)</FieldLabel>
                  <Input id="schedule-start-time" type="time" {...form.register('startTime')} />
                  <FieldError
                    errors={
                      form.formState.errors.startTime
                        ? [form.formState.errors.startTime]
                        : undefined
                    }
                  />
                </Field>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="schedule-end-date">Tanggal selesai (opsional)</FieldLabel>
                <Input id="schedule-end-date" type="date" {...form.register('endDate')} />
                <FieldError
                  errors={
                    form.formState.errors.endDate ? [form.formState.errors.endDate] : undefined
                  }
                />
              </Field>

              {!allDay ? (
                <Field>
                  <FieldLabel htmlFor="schedule-end-time">
                    Waktu selesai (WITA, opsional)
                  </FieldLabel>
                  <Input id="schedule-end-time" type="time" {...form.register('endTime')} />
                  <FieldError
                    errors={
                      form.formState.errors.endTime ? [form.formState.errors.endTime] : undefined
                    }
                  />
                </Field>
              ) : null}
            </div>

            <Field>
              <FieldLabel htmlFor="schedule-location">Tempat (opsional)</FieldLabel>
              <Input
                id="schedule-location"
                maxLength={TITLE_MAX_LENGTH}
                {...form.register('location')}
              />
              <FieldError
                errors={
                  form.formState.errors.location ? [form.formState.errors.location] : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="schedule-status">Status</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="schedule-status" className="w-full sm:w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {SCHEDULE_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError
                errors={form.formState.errors.status ? [form.formState.errors.status] : undefined}
              />
            </Field>
          </FieldGroup>

          {formError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2Icon className="animate-spin" /> : null}
              {isEdit ? 'Simpan perubahan' : 'Simpan agenda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
