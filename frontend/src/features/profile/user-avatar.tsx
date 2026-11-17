'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { SessionUser } from '@/features/auth/auth.api';
import { getInitials } from '@/lib/initials';

import { useAvatarUrl } from './use-avatar';

type UserAvatarProps = {
  user: SessionUser;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
};

export function UserAvatar({ user, size = 'default', className }: UserAvatarProps) {
  const url = useAvatarUrl(user);

  return (
    <Avatar size={size} className={className}>
      {url ? <AvatarImage src={url} alt={`Foto profil ${user.name}`} /> : null}
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
