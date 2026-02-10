import { http, HttpResponse } from 'msw';

const NOW = '2026-01-15T10:00:00Z';

export const sampleHandlers = [
  http.get('/api/clones/:cloneId/samples', () => {
    return HttpResponse.json({ items: [], total: 0 });
  }),

  http.post('/api/clones/:cloneId/samples', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'sample-new',
        clone_id: 'clone-1',
        content: body.content ?? '',
        content_type: body.content_type ?? 'blog_post',
        content_type_detected: null,
        word_count: String(body.content ?? '')
          .split(/\s+/)
          .filter(Boolean).length,
        length_category: null,
        source_type: body.source_type ?? 'paste',
        source_url: null,
        source_filename: null,
        created_at: NOW,
      },
      { status: 201 }
    );
  }),

  http.post('/api/clones/:cloneId/samples/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const contentType = (formData.get('content_type') as string) ?? 'blog_post';
    return HttpResponse.json(
      {
        id: 'sample-upload',
        clone_id: 'clone-1',
        content: file ? `[uploaded: ${file.name}]` : '',
        content_type: contentType,
        content_type_detected: null,
        word_count: 0,
        length_category: null,
        source_type: 'file',
        source_url: null,
        source_filename: file?.name ?? null,
        created_at: NOW,
      },
      { status: 201 }
    );
  }),

  http.post('/api/clones/:cloneId/samples/url', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'sample-url',
        clone_id: 'clone-1',
        content: `[scraped from ${body.url}]`,
        content_type: body.content_type ?? 'blog_post',
        content_type_detected: null,
        word_count: 0,
        length_category: null,
        source_type: 'url',
        source_url: body.url ?? null,
        source_filename: null,
        created_at: NOW,
      },
      { status: 201 }
    );
  }),

  http.delete('/api/clones/:cloneId/samples/:sampleId', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
