import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { AuthenticityScoreResponse, ContentListResponse, ContentResponse } from '@/types/api';

interface ContentListParams {
  sort?: string;
  order?: string;
  clone_id?: string;
  platform?: string;
  status?: string;
  search?: string;
}

export function useContentList(params: ContentListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);
  if (params.clone_id) searchParams.set('clone_id', params.clone_id);
  if (params.platform) searchParams.set('platform', params.platform);
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();
  const url = qs ? `/api/content?${qs}` : '/api/content';

  return useQuery({
    queryKey: queryKeys.content.list(params),
    queryFn: () => api.get<ContentListResponse>(url),
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids: string[]; status: string }) =>
      api.post('/api/content/bulk/status', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
    },
  });
}

export function useBulkDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids: string[] }) => api.post('/api/content/bulk/delete', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
    },
  });
}

export function useBulkAddTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids: string[]; tags: string[] }) =>
      api.post('/api/content/bulk/tag', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
    },
  });
}

interface GenerateContentRequest {
  clone_id: string;
  platforms: string[];
  input_text: string;
  properties?: Record<string, unknown>;
}

export interface GenerateContentResponse {
  items: ContentResponse[];
}

interface UpdateContentRequest {
  id: string;
  content_current: string;
  status?: string;
}

export function useGenerateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateContentRequest) =>
      api.post<GenerateContentResponse>('/api/content/generate', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateContentRequest) =>
      api.put<ContentResponse>(`/api/content/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
    },
  });
}

export function useScoreContent() {
  return useMutation({
    mutationFn: (id: string) => api.post<AuthenticityScoreResponse>(`/api/content/${id}/score`),
  });
}

export function useRegenerateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateContentRequest) =>
      api.post<GenerateContentResponse>('/api/content/generate', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
    },
  });
}
