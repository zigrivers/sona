import { http, HttpResponse } from 'msw';

const NOW = '2026-01-15T10:00:00Z';

export const methodologyHandlers = [
  http.get('/api/methodology', () => {
    return HttpResponse.json([
      {
        id: 'method-1',
        section_key: 'voice_cloning',
        current_content: 'Default methodology instructions.',
        created_at: NOW,
        updated_at: NOW,
      },
    ]);
  }),

  http.put('/api/methodology/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: params.id,
      section_key: 'voice_cloning',
      current_content: body.content ?? 'Updated content.',
      created_at: NOW,
      updated_at: NOW,
    });
  }),
];
