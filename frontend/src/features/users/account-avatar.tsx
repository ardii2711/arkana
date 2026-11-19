'use client';

import { useQuery } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useObjectUrl } from '@/hooks/use-object-url';
import { getInitials } from '@/lib/initials';
import { fetchUserAvatar, type AdminAccount } from './users.api';

export function AccountAvatar({
  account,
  className,
}: {
  account: AdminAccount;
  className?: string;
}) {
  const { data: blob } = useQuery({
    queryKey: ['users', 'avatar', account.id, account.updatedAt],
    queryFn: () => fetchUserAvatar(account.id),
    enabled: account.role === 'USER' && account.hasAvatar,
    staleTime: Infinity,
    retry: false,
  });

  const url = useObjectUrl(blob);

  return (
    <Avatar className={className}>
      {url ? <AvatarImage src={url} alt={`Foto profil ${account.name}`} /> : null}
      <AvatarFallback className="text-xs">{getInitials(account.name)}</AvatarFallback>
    </Avatar>
  );
}
