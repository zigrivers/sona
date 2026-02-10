import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { CloneListResponse, CloneResponse } from '@/types/api';

export function useClones() {
  return useQuery({
    queryKey: queryKeys.clones.list(),
    queryFn: () => api.get<CloneListResponse>('/api/clones'),
  });
}

export function useClone(id: string) {
  return useQuery({
    queryKey: queryKeys.clones.detail(id),
    queryFn: () => api.get<CloneResponse>(`/api/clones/${id}`),
  });
}

export function useCreateClone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; tags?: string[] }) =>
      api.post<CloneResponse>('/api/clones', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clones.list() });
    },
  });
}

export function useUpdateClone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; description?: string; tags?: string[]; is_hidden?: boolean };
    }) => api.put<CloneResponse>(`/api/clones/${id}`, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clones.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.clones.detail(id) });
    },
  });
}

export function useDeleteClone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/clones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clones.list() });
    },
  });
}
