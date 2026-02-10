import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ContentResponse } from '@/types/api';

interface GenerateContentRequest {
  clone_id: string;
  platforms: string[];
  input_text: string;
  properties?: Record<string, unknown>;
}

interface GenerateContentResponse {
  items: ContentResponse[];
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
