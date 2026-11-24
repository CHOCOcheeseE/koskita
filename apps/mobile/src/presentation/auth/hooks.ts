import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { container } from '@/data/container';
import type { UpdateProfileInput } from '@/domain/auth/auth';

import { queryKeys } from '../shared/query-keys';

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: () => container.auth.getProfile(), staleTime: 5 * 60_000 });
}

/** ID pengguna yang sedang masuk (undefined selama profil belum dimuat). */
export function useMyId(): string | undefined {
  return useMe().data?.id;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => container.auth.updateProfile(input),
    onSuccess: (user) => qc.setQueryData(queryKeys.me, user),
  });
}
