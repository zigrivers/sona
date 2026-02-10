import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { AuthenticityScoreResponse, ContentListResponse, ContentResponse } from '@/types/api';

interface ContentListParams {
  sort?: string;
  order?: string;
}

export function useContentList(params: ContentListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);
  const qs = searchParams.toString();
  const url = qs ? `/api/content?${qs}` : '/api/content';

  return useQuery({
    queryKey: queryKeys.content.list(params),
    queryFn: () => api.get<ContentListResponse>(url),
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
