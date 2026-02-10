import { http, HttpResponse } from 'msw';

import { buildDna } from '../factories';

const NOW = '2026-01-15T10:00:00Z';

export const dnaHandlers = [
  http.get('/api/clones/:cloneId/dna', () => {
    return HttpResponse.json(null, { status: 404 });
  }),

  http.put('/api/clones/:cloneId/dna', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      buildDna({
        clone_id: params.cloneId as string,
        data: (body.data as Record<string, unknown>) ?? {},
        trigger: 'manual_edit',
        version_number: 2,
        created_at: NOW,
      })
    );
  }),

  http.post('/api/clones/:cloneId/analyze', ({ params }) => {
    return HttpResponse.json(
      buildDna({
        clone_id: params.cloneId as string,
        trigger: 'initial_analysis',
        version_number: 1,
      }),
      { status: 201 }
    );
  }),
];
