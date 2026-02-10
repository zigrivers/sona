import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PresetResponse } from '@/types/api';

export function usePresets() {
  return useQuery({
    queryKey: queryKeys.presets.list(),
    queryFn: () => api.get<PresetResponse[]>('/api/presets'),
  });
}

interface CreatePresetRequest {
  name: string;
  properties: Record<string, unknown>;
}

export function useCreatePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePresetRequest) => api.post<PresetResponse>('/api/presets', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.presets.list() });
      toast.success('Preset created');
    },
  });
}

interface UpdatePresetRequest {
  id: string;
  name?: string;
  properties?: Record<string, unknown>;
}

export function useUpdatePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdatePresetRequest) =>
      api.put<PresetResponse>(`/api/presets/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.presets.list() });
      toast.success('Preset updated');
    },
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/presets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.presets.list() });
      toast.success('Preset deleted');
    },
  });
}
