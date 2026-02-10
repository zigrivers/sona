import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  useMethodologySection,
  useMethodologyVersions,
  useRevertMethodology,
  useUpdateMethodology,
} from './use-methodology';

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

describe('useMethodologySection', () => {
  it('fetches section content', async () => {
    const { result } = renderHook(() => useMethodologySection('voice_cloning'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.section_key).toBe('voice_cloning');
    expect(result.current.data?.current_content).toBe('Voice cloning methodology instructions.');
  });
});

describe('useUpdateMethodology', () => {
  it('sends PUT and returns updated section', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateMethodology('voice_cloning'), { wrapper });

    result.current.mutate('Updated content');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.current_content).toBe('Updated content');
  });
});

describe('useMethodologyVersions', () => {
  it('fetches version history', async () => {
    const { result } = renderHook(() => useMethodologyVersions('voice_cloning'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].version_number).toBe(2);
    expect(result.current.data?.[1].version_number).toBe(1);
  });
});

describe('useRevertMethodology', () => {
  it('sends POST and returns reverted section', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useRevertMethodology('voice_cloning'), { wrapper });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.current_content).toBe('Reverted content.');
  });
});
