import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { DNAResponse, DNAVersionListResponse } from '@/types/api';
import { ApiError } from '@/types/errors';

export function useDna(cloneId: string) {
  return useQuery({
    queryKey: queryKeys.dna.detail(cloneId),
    queryFn: async () => {
      try {
        return await api.get<DNAResponse>(`/api/clones/${cloneId}/dna`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });
}

export function useUpdateDna(cloneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      data: Record<string, unknown>;
      prominence_scores?: Record<string, number>;
    }) => api.put<DNAResponse>(`/api/clones/${cloneId}/dna`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dna.detail(cloneId) });
    },
  });
}

export function useAnalyzeDna(cloneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<DNAResponse>(`/api/clones/${cloneId}/analyze`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dna.detail(cloneId) });
    },
  });
}

export function useDnaVersions(cloneId: string) {
  return useQuery({
    queryKey: queryKeys.dna.versions(cloneId),
    queryFn: () => api.get<DNAVersionListResponse>(`/api/clones/${cloneId}/dna/versions`),
  });
}

export function useRevertDna(cloneId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) =>
      api.post<DNAResponse>(`/api/clones/${cloneId}/dna/revert/${version}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dna.versions(cloneId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dna.detail(cloneId) });
      toast.success('Version reverted');
    },
    onError: () => {
      toast.error('Failed to revert version');
    },
  });
}
