'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { NAME_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/lib/limits';
import { WORK_CATEGORIES, WORK_CATEGORY_LABELS } from '@/lib/work-category';
import type { WorkLog } from './work-log.api';
import { workLogSchema, type WorkLogFormValues } from './work-log.schemas';
import { useCreateWorkLog, useUpdateWorkLog } from './use-work-logs';

type WorkLogFormDialogProps = {
  workLog: WorkLog | null;
  onOpenChange: (open: boolean) => void;
};

export function WorkLogFormDialog({ workLog, onOpenChange }: WorkLogFormDialogProps) {
  const isEdit = workLog !== null;
  const create = useCreateWorkLog();
  const update = useUpdateWorkLog(workLog?.id ?? '');
  const mutation = isEdit ? update : create;
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<WorkLogFormValues>({
    resolver: zodResolver(workLogSchema),
    defaultValues: {
      name: workLog?.name ?? '',
      description: workLog?.description ?? '',
      output: workLog?.output ?? '',
      category: workLog?.category ?? WORK_CATEGORIES[0],
      target: workLog?.target ?? '',
      realisasi: workLog?.realisasi ?? '',
    },
  });

  function onSubmit(values: WorkLogFormValues) {
    setFormError(null);
    mutation.mutate(
      { ...values, target: values.target || null, realisasi: values.realisasi || null },
      {
        onSuccess: () => {
          toast.success(isEdit ? 'Kegiatan diperbarui.' : 'Kegiatan disimpan.');
          onOpenChange(false);
        },
        onError: (error) => setFormError(getErrorMessage(error)),
      },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah kegiatan' : 'Catat kegiatan'}</DialogTitle>
          <DialogDescription>
            Tanggal kegiatan memakai tanggal hari ini. Target dan realisasi bersifat opsional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup className="max-h-[60vh] gap-4 overflow-y-auto px-1">
            {formError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="work-log-name">Nama kegiatan</FieldLabel>
                  <Input
                    {...field}
                    id="work-log-name"
                    maxLength={TITLE_MAX_LENGTH}
                    placeholder="Contoh: Rapat koordinasi penyusunan laporan bulanan"
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="category"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="work-log-category-form">Kategori</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="work-log-category-form"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {WORK_CATEGORY_LABELS[category]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="work-log-description">Uraian pekerjaan</FieldLabel>
                  <Textarea
                    {...field}
                    id="work-log-description"
                    rows={5}
                    placeholder="Jelaskan pekerjaan yang dilakukan"
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="output"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="work-log-output">Hasil atau output</FieldLabel>
                  <Textarea
                    {...field}
                    id="work-log-output"
                    rows={3}
                    placeholder="Contoh: Dokumen laporan bulanan selesai"
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="target"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="work-log-target">Target (opsional)</FieldLabel>
                    <Input
                      {...field}
                      id="work-log-target"
                      maxLength={NAME_MAX_LENGTH}
                      placeholder="Contoh: 1 dokumen"
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />

              <Controller
                name="realisasi"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="work-log-realisasi">Realisasi (opsional)</FieldLabel>
                    <Input
                      {...field}
                      id="work-log-realisasi"
                      maxLength={NAME_MAX_LENGTH}
                      placeholder="Contoh: 1 dokumen"
                      aria-invalid={fieldState.invalid}
                      disabled={mutation.isPending}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2Icon aria-hidden="true" className="animate-spin" />
                  Menyimpan…
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
