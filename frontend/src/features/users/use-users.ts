'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchUsers,
  inviteUser,
  resendInvitation,
  updateUser,
  type InviteUserInput,
  type UpdateUserInput,
  type UserListParams,
} from './users.api';

const usersRootKey = ['users'] as const;
const dashboardRootKey = ['dashboard'] as const;

function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: usersRootKey });
    queryClient.invalidateQueries({ queryKey: dashboardRootKey });
  };
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: [...usersRootKey, 'list', params],
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useInviteUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (input: InviteUserInput) => inviteUser(input),
    onSuccess: invalidate,
  });
}

export function useUpdateUser(id: string) {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(id, input),
    onSuccess: invalidate,
  });
}

export function useResendInvitation() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (id: string) => resendInvitation(id),
    onSuccess: invalidate,
  });
}
