import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ProviderResponse, ProviderTestResponse } from '@/types/api';

export function useProviders() {
  return useQuery({
    queryKey: queryKeys.providers.all(),
    queryFn: () => api.get<ProviderResponse[]>('/api/providers'),
  });
}

export function useSaveProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      body,
    }: {
      name: string;
      body: { api_key?: string; default_model?: string };
    }) => api.put<ProviderResponse>(`/api/providers/${name}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() });
    },
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (name: string) => api.post<ProviderTestResponse>(`/api/providers/${name}/test`),
  });
}

export function useSetDefaultProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.put<ProviderResponse>('/api/providers/default', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() });
    },
  });
}
