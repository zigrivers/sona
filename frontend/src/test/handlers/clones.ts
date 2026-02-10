import { http, HttpResponse } from 'msw';

const NOW = '2026-01-15T10:00:00Z';

export const cloneHandlers = [
  http.get('/api/clones', () => {
    return HttpResponse.json({ items: [], total: 0 });
  }),

  http.get('/api/clones/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test Clone',
      description: null,
      tags: [],
      type: 'original',
      is_demo: false,
      is_hidden: false,
      avatar_path: null,
      confidence_score: 0,
      sample_count: 0,
      created_at: NOW,
      updated_at: NOW,
    });
  }),

  http.post('/api/clones', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'clone-new',
        name: body.name ?? 'New Clone',
        description: body.description ?? null,
        tags: body.tags ?? [],
        type: 'original',
        is_demo: false,
        is_hidden: false,
        avatar_path: null,
        confidence_score: 0,
        sample_count: 0,
        created_at: NOW,
        updated_at: NOW,
      },
      { status: 201 }
    );
  }),

  http.put('/api/clones/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: params.id,
      name: body.name ?? 'Test Clone',
      description: body.description ?? null,
      tags: body.tags ?? [],
      type: 'original',
      is_demo: false,
      is_hidden: false,
      avatar_path: null,
      confidence_score: 0,
      sample_count: 0,
      created_at: NOW,
      updated_at: NOW,
    });
  }),

  http.delete('/api/clones/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
