import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { MethodologyResponse, MethodologyVersionResponse } from '@/types/api';

export function useMethodologySection(sectionKey: string) {
  return useQuery({
    queryKey: queryKeys.methodology.section(sectionKey),
    queryFn: () => api.get<MethodologyResponse>(`/api/methodology/${sectionKey}`),
  });
}

export function useUpdateMethodology(sectionKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      api.put<MethodologyResponse>(`/api/methodology/${sectionKey}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.methodology.section(sectionKey) });
      queryClient.invalidateQueries({ queryKey: queryKeys.methodology.versions(sectionKey) });
      toast.success('Methodology saved');
    },
    onError: () => {
      toast.error('Failed to save methodology');
    },
  });
}

export function useMethodologyVersions(sectionKey: string) {
  return useQuery({
    queryKey: queryKeys.methodology.versions(sectionKey),
    queryFn: () => api.get<MethodologyVersionResponse[]>(`/api/methodology/${sectionKey}/versions`),
  });
}

export function useRevertMethodology(sectionKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) =>
      api.post<MethodologyResponse>(`/api/methodology/${sectionKey}/revert/${version}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.methodology.section(sectionKey) });
      queryClient.invalidateQueries({ queryKey: queryKeys.methodology.versions(sectionKey) });
      toast.success('Methodology reverted');
    },
    onError: () => {
      toast.error('Failed to revert methodology');
    },
  });
}
