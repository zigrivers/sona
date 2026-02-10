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
    versions: (id: string) => ['content', id, 'versions'] as const,
  },

  samples: {
    list: (cloneId: string) => ['samples', 'list', cloneId] as const,
  },

  dna: {
    detail: (cloneId: string) => ['dna', 'detail', cloneId] as const,
    versions: (cloneId: string) => ['dna', 'versions', cloneId] as const,
  },

  methodology: {
    all: () => ['methodology'] as const,
    section: (key: string) => ['methodology', key] as const,
    versions: (key: string) => ['methodology', key, 'versions'] as const,
  },

  providers: {
    all: () => ['providers'] as const,
  },

  data: {
    stats: () => ['data', 'stats'] as const,
  },
};
