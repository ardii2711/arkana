'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

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

  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}
