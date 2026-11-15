'use client';

import { PencilIcon } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSession } from '@/features/auth/use-auth';
import { getInitials } from '@/lib/initials';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  USER: 'User',
} as const;

const STATUS_LABELS = {
  ACTIVE: 'Aktif',
  INVITED: 'Diundang',
  INACTIVE: 'Nonaktif',
} as const;

export function ProfileView() {
  const { data: user } = useSession();

  if (!user) return null;

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="text-muted-foreground text-sm">Informasi akun ARKANA Anda.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate text-lg">{user.name}</CardTitle>
              <CardDescription className="truncate">{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium">Nama</dt>
              <dd className="text-sm">{user.name}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium">Email</dt>
              <dd className="text-sm break-all">{user.email}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium">Role</dt>
              <dd className="text-sm">{ROLE_LABELS[user.role]}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium">Status</dt>
              <dd className="text-sm">{STATUS_LABELS[user.status]}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              Edit profil akan tersedia setelah API profil tersedia.
            </p>
            <Button variant="outline" disabled>
              <PencilIcon />
              Edit profil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
