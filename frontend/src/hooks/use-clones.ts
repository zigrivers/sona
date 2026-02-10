import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { CloneListResponse } from '@/types/api';

export function useClones() {
  return useQuery({
    queryKey: queryKeys.clones.list(),
    queryFn: () => api.get<CloneListResponse>('/api/clones'),
  });
}
