'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CameraIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PasswordInput } from '@/components/shared/password-input';
import { UserAvatar } from '@/features/profile/user-avatar';
import { getErrorMessage } from '@/lib/api-error';
import { formatFileSize } from '@/lib/file-format';
import { AVATAR_MAX_BYTES } from '@/lib/limits';
import { getDisplayName } from '@/lib/display-name';
import type { SessionUser } from '@/features/auth/auth.api';
import { useChangePassword, useSession } from '@/features/auth/use-auth';
import { AVATAR_ACCEPT, AVATAR_EXTENSIONS } from './profile.api';
import {
  NONE_VALUE,
  PNS_GOLONGAN,
  PPPK_GOLONGAN,
  emailChangeSchema,
  passwordChangeSchema,
  profileFormSchema,
  type EmailChangeValues,
  type PasswordChangeValues,
  type ProfileFormValues,
} from './profile.schemas';
import {
  useDeleteAvatar,
  useRequestEmailChange,
  useUpdateProfile,
  useUploadAvatar,
} from './use-profile';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  USER: 'User',
} as const;

const STATUS_LABELS = {
  ACTIVE: 'Aktif',
  INVITED: 'Diundang',
  INACTIVE: 'Nonaktif',
} as const;

function IdentityCard({ user }: { user: SessionUser }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const remove = useDeleteAvatar();

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (!(AVATAR_EXTENSIONS as readonly string[]).includes(extension)) {
      toast.error('Format avatar harus JPG, JPEG, PNG, atau WEBP');
      event.target.value = '';
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(`Ukuran avatar maksimal ${formatFileSize(AVATAR_MAX_BYTES)}`);
      event.target.value = '';
      return;
    }

    upload.mutate(file, {
      onSuccess: () => toast.success('Foto profil diperbarui'),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
    event.target.value = '';
  }

  function onDelete() {
    remove.mutate(undefined, {
      onSuccess: () => toast.success('Foto profil dihapus'),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" className="size-20 text-xl" />
          <div className="grid gap-1">
            <span className="text-base font-semibold break-words">{getDisplayName(user)}</span>
            <span className="text-muted-foreground text-sm break-all">{user.email}</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
              <Badge variant="outline">{STATUS_LABELS[user.status]}</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:ml-auto sm:items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={onFileChange}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={upload.isPending || remove.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {upload.isPending ? <Loader2Icon className="animate-spin" /> : <CameraIcon />}
              {upload.isPending ? 'Mengunggah…' : 'Ubah foto'}
            </Button>
            {user.hasAvatar ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={remove.isPending}>
                    {remove.isPending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
                    Hapus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus foto profil?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Foto profil akan dihapus dan digantikan inisial nama.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileFormCard({ user }: { user: SessionUser }) {
  const updateProfile = useUpdateProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      titleBefore: user.titleBefore ?? '',
      titleAfter: user.titleAfter ?? '',
      nip: user.nip ?? '',
      employeeStatus: user.employeeStatus ?? NONE_VALUE,
      golongan: user.golongan ?? NONE_VALUE,
      position: user.position ?? '',
      unit: user.unit ?? '',
    },
  });

  const [name, titleBefore, titleAfter, employeeStatus] = useWatch({
    control: form.control,
    name: ['name', 'titleBefore', 'titleAfter', 'employeeStatus'],
  });
  const displayPreview = getDisplayName({ name, titleBefore, titleAfter });

  function onSubmit(values: ProfileFormValues) {
    setFormError(null);

    const text = (value: string) => {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    };

    updateProfile.mutate(
      {
        name: values.name.trim(),
        titleBefore: text(values.titleBefore),
        titleAfter: text(values.titleAfter),
        nip: values.nip.trim() === '' ? null : values.nip.trim(),
        employeeStatus: employeeStatus === NONE_VALUE ? null : (employeeStatus as 'PNS' | 'PPPK'),
        golongan: values.golongan === NONE_VALUE ? null : values.golongan,
        position: text(values.position),
        unit: text(values.unit),
      },
      {
        onSuccess: () => toast.success('Profil diperbarui'),
        onError: (error) => setFormError(getErrorMessage(error)),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelengkapan Profil</CardTitle>
        <CardDescription>
          Data kepegawaian bersifat opsional. Kosongkan kolom dan simpan untuk menghapus isian.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
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
                  <FieldLabel htmlFor="profile-name">Nama lengkap</FieldLabel>
                  <Input
                    {...field}
                    id="profile-name"
                    aria-invalid={fieldState.invalid}
                    disabled={updateProfile.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="titleBefore"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-title-before">Gelar depan</FieldLabel>
                    <Input
                      {...field}
                      id="profile-title-before"
                      placeholder="Ir."
                      aria-invalid={fieldState.invalid}
                      disabled={updateProfile.isPending}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Controller
                name="titleAfter"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-title-after">Gelar belakang</FieldLabel>
                    <Input
                      {...field}
                      id="profile-title-after"
                      placeholder="S.T., M.M."
                      aria-invalid={fieldState.invalid}
                      disabled={updateProfile.isPending}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </div>

            <p className="text-muted-foreground text-xs">
              Nama tampilan:{' '}
              <span className="text-foreground font-medium">{displayPreview || '—'}</span>
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="nip"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-nip">NIP</FieldLabel>
                    <Input
                      {...field}
                      id="profile-nip"
                      inputMode="numeric"
                      maxLength={18}
                      placeholder="18 digit angka"
                      aria-invalid={fieldState.invalid}
                      disabled={updateProfile.isPending}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Controller
                name="employeeStatus"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="profile-employee-status">Status kepegawaian</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const current = form.getValues('golongan');
                        if (
                          current !== NONE_VALUE &&
                          ((value === 'PNS' &&
                            !(PNS_GOLONGAN as readonly string[]).includes(current)) ||
                            (value === 'PPPK' &&
                              !(PPPK_GOLONGAN as readonly string[]).includes(current)))
                        ) {
                          form.setValue('golongan', NONE_VALUE);
                        }
                      }}
                      disabled={updateProfile.isPending}
                    >
                      <SelectTrigger id="profile-employee-status">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>Tidak diisi</SelectItem>
                        <SelectItem value="PNS">PNS</SelectItem>
                        <SelectItem value="PPPK">PPPK</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="golongan"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="profile-golongan">Pangkat / Golongan</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={updateProfile.isPending}
                    >
                      <SelectTrigger id="profile-golongan">
                        <SelectValue placeholder="Pilih golongan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>Tidak diisi</SelectItem>
                        {employeeStatus !== 'PPPK' ? (
                          <SelectGroup>
                            <SelectLabel>PNS</SelectLabel>
                            {PNS_GOLONGAN.map((golongan) => (
                              <SelectItem key={golongan} value={golongan}>
                                {golongan}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ) : null}
                        {employeeStatus !== 'PNS' ? (
                          <SelectGroup>
                            <SelectLabel>PPPK</SelectLabel>
                            {PPPK_GOLONGAN.map((golongan) => (
                              <SelectItem key={golongan} value={golongan}>
                                {golongan}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ) : null}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="position"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-position">Jabatan</FieldLabel>
                    <Input
                      {...field}
                      id="profile-position"
                      placeholder="Analis Kebijakan"
                      aria-invalid={fieldState.invalid}
                      disabled={updateProfile.isPending}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="unit"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-unit">Unit kerja</FieldLabel>
                  <Input
                    {...field}
                    id="profile-unit"
                    placeholder="Bagian Perencanaan"
                    aria-invalid={fieldState.invalid}
                    disabled={updateProfile.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" aria-hidden="true" />
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <PencilIcon />
                    Simpan perubahan
                  </>
                )}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function EmailCard({ user }: { user: SessionUser }) {
  const requestChange = useRequestEmailChange();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<EmailChangeValues>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: EmailChangeValues) {
    setFormError(null);

    requestChange.mutate(values.email, {
      onSuccess: () => {
        toast.success(`Tautan verifikasi dikirim ke ${values.email}`);
        form.reset({ email: '' });
      },
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email</CardTitle>
        <CardDescription>
          Email Anda saat ini: <span className="text-foreground font-medium">{user.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {user.pendingEmail ? (
            <Alert>
              <InfoIcon />
              <AlertDescription>
                Menunggu verifikasi: tautan dikirim ke{' '}
                <span className="font-medium">{user.pendingEmail}</span>. Klik tautan pada email itu
                untuk menyelesaikan perubahan.
              </AlertDescription>
            </Alert>
          ) : null}
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {formError ? (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-email">Email baru</FieldLabel>
                    <Input
                      {...field}
                      id="profile-email"
                      type="email"
                      placeholder="nama@instansi.go.id"
                      aria-invalid={fieldState.invalid}
                      disabled={requestChange.isPending}
                    />
                    <FieldDescription>
                      Kami kirim tautan verifikasi ke email baru. Email berubah setelah tautan
                      diklik.
                    </FieldDescription>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" variant="outline" disabled={requestChange.isPending}>
                  {requestChange.isPending ? (
                    <>
                      <Loader2Icon className="animate-spin" aria-hidden="true" />
                      Mengirim…
                    </>
                  ) : (
                    'Kirim tautan verifikasi'
                  )}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const change = useChangePassword();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  function onSubmit(values: PasswordChangeValues) {
    setFormError(null);

    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success('Password diperbarui. Sesi lain telah dicabut.');
          form.reset();
        },
        onError: (error) => setFormError(getErrorMessage(error)),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keamanan</CardTitle>
        <CardDescription>
          Ganti password akun. Sesi lain Anda akan dicabut setelah password diganti.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {formError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <Controller
              name="currentPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-current-password">Kata sandi sekarang</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="profile-current-password"
                    autoComplete="current-password"
                    placeholder="Kata sandi saat ini"
                    aria-invalid={fieldState.invalid}
                    disabled={change.isPending}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="newPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-new-password">Kata sandi baru</FieldLabel>
                    <PasswordInput
                      {...field}
                      id="profile-new-password"
                      autoComplete="new-password"
                      placeholder="Minimal 8 karakter"
                      aria-invalid={fieldState.invalid}
                      disabled={change.isPending}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-confirm-password">
                      Ulangi kata sandi baru
                    </FieldLabel>
                    <PasswordInput
                      {...field}
                      id="profile-confirm-password"
                      autoComplete="new-password"
                      placeholder="Ulangi kata sandi baru"
                      aria-invalid={fieldState.invalid}
                      disabled={change.isPending}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={change.isPending}>
                {change.isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" aria-hidden="true" />
                    Menyimpan…
                  </>
                ) : (
                  'Ganti password'
                )}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export function ProfileView() {
  const { data: user } = useSession();

  if (!user) return null;

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="text-muted-foreground text-sm">
          Kelola informasi akun dan kelengkapan data Anda.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <IdentityCard user={user} />
        <ProfileFormCard user={user} />
        <EmailCard user={user} />
        <PasswordCard />
      </div>
    </div>
  );
}
