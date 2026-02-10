import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { CloneResponse, DNAResponse } from '@/types/api';
import type { DNACategory } from '@/types/dna';
import { ApiError } from '@/types/errors';

export function useClonesWithDna(cloneIds: string[]) {
  return useQueries({
    queries: cloneIds.map((id) => ({
      queryKey: queryKeys.dna.detail(id),
      queryFn: async () => {
        try {
          return await api.get<DNAResponse>(`/api/clones/${id}/dna`);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) {
            return null;
          }
          throw error;
        }
      },
    })),
  });
}

interface MergeSourceClone {
  clone_id: string;
  weights: Record<DNACategory, number>;
}

interface MergeRequest {
  name: string;
  source_clones: MergeSourceClone[];
}

export function useMerge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MergeRequest) => api.post<CloneResponse>('/api/clones/merge', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clones.list() });
    },
  });
}
