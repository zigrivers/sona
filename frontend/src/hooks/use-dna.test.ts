import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { buildDna } from '@/test/factories';
import { server } from '@/test/handlers';

import { useAnalyzeDna, useDna, useDnaVersions, useRevertDna, useUpdateDna } from './use-dna';

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

describe('useDna', () => {
  it('returns null when no DNA exists (404)', async () => {
    const { result } = renderHook(() => useDna('clone-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('returns DNA when it exists', async () => {
    const dna = buildDna({ clone_id: 'clone-1' });
    server.use(http.get('/api/clones/:cloneId/dna', () => HttpResponse.json(dna)));

    const { result } = renderHook(() => useDna('clone-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.clone_id).toBe('clone-1');
    expect(result.current.data?.data).toHaveProperty('vocabulary');
  });
});

describe('useUpdateDna', () => {
  it('sends PUT with data and returns updated DNA', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateDna('clone-1'), { wrapper });

    const newData = { vocabulary: { complexity_level: 'advanced', jargon_usage: 'heavy' } };
    result.current.mutate({ data: newData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.trigger).toBe('manual_edit');
  });
});

describe('useAnalyzeDna', () => {
  it('sends POST and returns new DNA version', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAnalyzeDna('clone-1'), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.trigger).toBe('initial_analysis');
  });
});

describe('useDnaVersions', () => {
  it('fetches version list', async () => {
    const versions = [
      buildDna({ version_number: 2, trigger: 'manual_edit' }),
      buildDna({ version_number: 1, trigger: 'initial_analysis' }),
    ];
    server.use(
      http.get('/api/clones/:cloneId/dna/versions', () => HttpResponse.json({ items: versions }))
    );

    const { result } = renderHook(() => useDnaVersions('clone-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.items[0].version_number).toBe(2);
  });
});

describe('useRevertDna', () => {
  it('sends POST and returns reverted DNA', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useRevertDna('clone-1'), { wrapper });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.trigger).toBe('revert');
  });
});
