import { useQuery } from '@tanstack/react-query';

import { container } from '@/data/container';

import { queryKeys } from '../shared/query-keys';

export function useHomeToday() {
  return useQuery({ queryKey: queryKeys.home, queryFn: () => container.home.getToday() });
}
