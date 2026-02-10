import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { useDatabaseStats } from './use-data';

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

describe('useDatabaseStats', () => {
  it('fetches database stats', async () => {
    const { result } = renderHook(() => useDatabaseStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.db_location).toBe('/data/sona.db');
    expect(result.current.data?.db_size_bytes).toBe(524288);
    expect(result.current.data?.clone_count).toBe(3);
    expect(result.current.data?.content_count).toBe(12);
    expect(result.current.data?.sample_count).toBe(7);
  });
});
