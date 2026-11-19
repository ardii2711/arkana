'use client';

import { useQuery } from '@tanstack/react-query';

import { useObjectUrl } from '@/hooks/use-object-url';
import type { SessionUser } from '@/features/auth/auth.api';

import { fetchAvatar } from './profile.api';

export function useAvatarUrl(user: SessionUser) {
  const { data: blob } = useQuery({
    queryKey: ['profile', 'avatar', user.id, user.updatedAt ?? 'unknown'],
    queryFn: fetchAvatar,
    enabled: Boolean(user.hasAvatar),
    staleTime: Infinity,
    retry: false,
  });

  return useObjectUrl(blob);
}
