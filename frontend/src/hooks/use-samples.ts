import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { SampleListResponse, SampleResponse } from '@/types/api';

export function useSamples(cloneId: string) {
  return useQuery({
    queryKey: queryKeys.samples.list(cloneId),
    queryFn: () => api.get<SampleListResponse>(`/api/clones/${cloneId}/samples`),
  });
}

export function useCreateSample(cloneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string; content_type: string; source_type: string }) =>
      api.post<SampleResponse>(`/api/clones/${cloneId}/samples`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.list(cloneId) });
    },
  });
}

export function useDeleteSample(cloneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sampleId: string) => api.delete(`/api/clones/${cloneId}/samples/${sampleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.list(cloneId) });
    },
  });
}
