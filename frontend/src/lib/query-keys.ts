/**
 * Query key factory for React Query. Append-only — each domain adds its keys.
 */
export const queryKeys = {
  clones: {
    list: (filters?: unknown) => ['clones', 'list', filters] as const,
    detail: (id: string) => ['clones', 'detail', id] as const,
  },

  content: {
    list: (filters?: unknown) => ['content', 'list', filters] as const,
    detail: (id: string) => ['content', 'detail', id] as const,
  },

  samples: {
    list: (cloneId: string) => ['samples', 'list', cloneId] as const,
  },

  dna: {
    detail: (cloneId: string) => ['dna', 'detail', cloneId] as const,
  },

  methodology: {
    all: () => ['methodology'] as const,
  },

  providers: {
    all: () => ['providers'] as const,
  },
};
