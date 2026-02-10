import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/handlers';

import {
  useFeedbackRegen,
  usePartialRegen,
  useRegenerateContent,
  useScoreContent,
  useUpdateContent,
} from './use-content';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return QueryClientProvider({ client: queryClient, children });
  };
}

describe('useUpdateContent', () => {
  it('calls PUT /api/content/:id', async () => {
    let capturedUrl = '';
    server.use(
      http.put('/api/content/:id', async ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'content-1',
          clone_id: 'clone-1',
          platform: 'linkedin',
          status: body.status ?? 'draft',
          content_current: body.content_current ?? 'Updated',
          content_original: 'Original',
          input_text: 'Write something.',
          generation_properties: null,
          authenticity_score: null,
          score_dimensions: null,
          topic: null,
          campaign: null,
          tags: [],
          word_count: 1,
          char_count: 7,
          preset_id: null,
          created_at: '2026-01-15T10:00:00Z',
          updated_at: '2026-01-15T10:00:00Z',
        });
      })
    );

    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'content-1',
      content_current: 'Updated text',
      status: 'published',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toBe('/api/content/content-1');
  });
});

describe('useScoreContent', () => {
  it('calls POST /api/content/:id/score', async () => {
    let capturedUrl = '';
    server.use(
      http.post('/api/content/:id/score', ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        return HttpResponse.json({
          overall_score: 78,
          dimensions: [{ name: 'Vocabulary', score: 80, feedback: 'Good' }],
        });
      })
    );

    const { result } = renderHook(() => useScoreContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('content-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toBe('/api/content/content-1/score');
    expect(result.current.data?.overall_score).toBe(78);
  });
});

describe('useRegenerateContent', () => {
  it('calls POST /api/content/generate for a single platform', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/content/generate', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            items: [
              {
                id: 'content-regen',
                clone_id: 'clone-1',
                platform: 'twitter',
                status: 'draft',
                content_current: 'Regenerated.',
                content_original: 'Regenerated.',
                input_text: 'Write about TDD.',
                generation_properties: null,
                authenticity_score: null,
                score_dimensions: null,
                topic: null,
                campaign: null,
                tags: [],
                word_count: 1,
                char_count: 12,
                preset_id: null,
                created_at: '2026-01-15T10:00:00Z',
                updated_at: '2026-01-15T10:00:00Z',
              },
            ],
          },
          { status: 201 }
        );
      })
    );

    const { result } = renderHook(() => useRegenerateContent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      clone_id: 'clone-1',
      platforms: ['twitter'],
      input_text: 'Write about TDD.',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedBody).not.toBeNull();
    expect((capturedBody as unknown as Record<string, unknown>).platforms).toEqual(['twitter']);
    expect(result.current.data?.items).toHaveLength(1);
  });
});

describe('useFeedbackRegen', () => {
  it('calls POST /api/content/:id/feedback-regen', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/content/:id/feedback-regen', async ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'content-1',
          clone_id: 'clone-1',
          platform: 'linkedin',
          status: 'draft',
          content_current: 'Improved content.',
          content_original: 'Original content.',
          input_text: 'Write something.',
          generation_properties: null,
          authenticity_score: null,
          score_dimensions: null,
          topic: null,
          campaign: null,
          tags: [],
          word_count: 2,
          char_count: 18,
          preset_id: null,
          created_at: '2026-01-15T10:00:00Z',
          updated_at: '2026-01-15T10:00:00Z',
        });
      })
    );

    const { result } = renderHook(() => useFeedbackRegen(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'content-1', feedback: 'Make it shorter.' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toBe('/api/content/content-1/feedback-regen');
    expect(capturedBody).not.toBeNull();
    expect((capturedBody as unknown as Record<string, unknown>).feedback).toBe('Make it shorter.');
  });
});

describe('usePartialRegen', () => {
  it('calls POST /api/content/:id/partial-regen', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/content/:id/partial-regen', async ({ request }) => {
        capturedUrl = new URL(request.url).pathname;
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'content-1',
          clone_id: 'clone-1',
          platform: 'linkedin',
          status: 'draft',
          content_current: 'Partially regenerated.',
          content_original: 'Original content.',
          input_text: 'Write something.',
          generation_properties: null,
          authenticity_score: null,
          score_dimensions: null,
          topic: null,
          campaign: null,
          tags: [],
          word_count: 2,
          char_count: 22,
          preset_id: null,
          created_at: '2026-01-15T10:00:00Z',
          updated_at: '2026-01-15T10:00:00Z',
        });
      })
    );

    const { result } = renderHook(() => usePartialRegen(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'content-1',
      selection_start: 0,
      selection_end: 10,
      feedback: 'More formal.',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toBe('/api/content/content-1/partial-regen');
    expect(capturedBody).not.toBeNull();
    expect((capturedBody as unknown as Record<string, unknown>).selection_start).toBe(0);
    expect((capturedBody as unknown as Record<string, unknown>).selection_end).toBe(10);
  });
});
