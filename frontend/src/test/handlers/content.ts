import { http, HttpResponse } from 'msw';

const NOW = '2026-01-15T10:00:00Z';

function buildContentItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'content-new',
    clone_id: 'clone-1',
    platform: 'linkedin',
    status: 'draft',
    content_current: 'AI-generated content.',
    content_original: 'AI-generated content.',
    input_text: 'Write something.',
    generation_properties: null,
    authenticity_score: null,
    score_dimensions: null,
    topic: null,
    campaign: null,
    tags: [],
    word_count: 2,
    char_count: 21,
    preset_id: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export const contentHandlers = [
  http.get('/api/content', () => {
    return HttpResponse.json({ items: [], total: 0 });
  }),

  http.get('/api/content/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      clone_id: 'clone-1',
      platform: 'linkedin',
      status: 'draft',
      content_current: 'Generated content.',
      content_original: 'Generated content.',
      input_text: 'Write about testing.',
      generation_properties: null,
      authenticity_score: null,
      score_dimensions: null,
      topic: null,
      campaign: null,
      tags: [],
      word_count: 2,
      char_count: 18,
      preset_id: null,
      created_at: NOW,
      updated_at: NOW,
    });
  }),

  http.post('/api/content/generate', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const platforms = (body.platforms as string[]) ?? ['linkedin'];
    const items = platforms.map((platform) =>
      buildContentItem({
        id: `content-${platform}`,
        clone_id: body.clone_id ?? 'clone-1',
        platform,
        input_text: body.input_text ?? 'Write something.',
      })
    );
    return HttpResponse.json({ items }, { status: 201 });
  }),
];
