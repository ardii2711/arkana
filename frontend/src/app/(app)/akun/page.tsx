import type { Metadata } from 'next';

import { UsersView } from '@/features/users/users-view';

export const metadata: Metadata = {
  title: 'Akun',
};

export default function AccountPage() {
  return <UsersView />;
}
