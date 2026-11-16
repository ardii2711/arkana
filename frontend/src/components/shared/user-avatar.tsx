'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchAvatar } from '@/features/profile/profile.api';
import type { SessionUser } from '@/features/auth/auth.api';
import { getInitials } from '@/lib/initials';

type UserAvatarProps = {
  user: SessionUser;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
};

export function UserAvatar({ user, size = 'default', className }: UserAvatarProps) {
  const { data: blob } = useQuery({
    queryKey: ['profile', 'avatar', user.id, user.updatedAt ?? 'unknown'],
    queryFn: fetchAvatar,
    enabled: Boolean(user.hasAvatar),
    staleTime: Infinity,
    retry: false,
  });

  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return (
    <Avatar size={size} className={className}>
      {url ? <AvatarImage src={url} alt={`Foto profil ${user.name}`} /> : null}
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
