import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  AuthenticityScoreResponse,
  ContentListResponse,
  ContentResponse,
  ContentVersionListResponse,
  DetectionResponse,
  GenerateVariantsResponse,
} from '@/types/api';

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

interface ScorePreviewRequest {
  clone_id: string;
  content_text: string;
}

export function useScorePreview() {
  return useMutation({
    mutationFn: (body: ScorePreviewRequest) =>
      api.post<AuthenticityScoreResponse>('/api/content/score-preview', body),
  });
}

export function useScoreContent() {
  return useMutation({
    mutationFn: (id: string) => api.post<AuthenticityScoreResponse>(`/api/content/${id}/score`),
  });
}

export function useDetectAI() {
  return useMutation({
    mutationFn: (id: string) => api.post<DetectionResponse>(`/api/content/${id}/detect`),
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

interface FeedbackRegenRequest {
  id: string;
  feedback: string;
}

export function useFeedbackRegen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback }: FeedbackRegenRequest) =>
      api.post<ContentResponse>(`/api/content/${id}/feedback-regen`, { feedback }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.content.versions(variables.id) });
    },
  });
}

interface PartialRegenRequest {
  id: string;
  selection_start: number;
  selection_end: number;
  feedback?: string;
}

export function usePartialRegen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: PartialRegenRequest) =>
      api.post<ContentResponse>(`/api/content/${id}/partial-regen`, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.content.versions(variables.id) });
    },
  });
}

interface ImportContentRequest {
  clone_id: string;
  platform: string;
  content_text: string;
  topic?: string;
  campaign?: string;
  tags?: string[];
}

export function useImportContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ImportContentRequest) =>
      api.post<ContentResponse>('/api/content/import', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
      toast.success('Content imported');
    },
  });
}

export function useUploadContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FormData) => api.upload<ContentResponse>('/api/content/import/upload', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
      toast.success('File imported');
    },
  });
}

export function useContentVersions(contentId: string) {
  return useQuery({
    queryKey: queryKeys.content.versions(contentId),
    queryFn: () => api.get<ContentVersionListResponse>(`/api/content/${contentId}/versions`),
  });
}

interface GenerateVariantsRequest {
  clone_id: string;
  platform: string;
  input_text: string;
  properties?: Record<string, unknown>;
}

export function useGenerateVariants() {
  return useMutation({
    mutationFn: (body: GenerateVariantsRequest) =>
      api.post<GenerateVariantsResponse>('/api/content/generate/variants', body),
  });
}

interface SaveVariantRequestBody {
  clone_id: string;
  platform: string;
  input_text: string;
  content_text: string;
  properties?: Record<string, unknown>;
}

export function useSaveVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveVariantRequestBody) =>
      api.post<ContentResponse>('/api/content/variants/select', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.list() });
    },
  });
}

export function useRestoreContentVersion(contentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) =>
      api.post<ContentResponse>(`/api/content/${contentId}/restore/${version}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.versions(contentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.content.detail(contentId) });
      toast.success('Version restored');
    },
    onError: () => {
      toast.error('Failed to restore version');
    },
  });
}
