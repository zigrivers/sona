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

  http.put('/api/content/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      buildContentItem({
        id: params.id as string,
        content_current: (body.content_current as string) ?? 'Updated content.',
        status: (body.status as string) ?? 'draft',
      })
    );
  }),

  http.post('/api/content/score-preview', () => {
    return HttpResponse.json({
      overall_score: 78,
      dimensions: [
        { name: 'Vocabulary', score: 80, feedback: 'Good match' },
        { name: 'Tone', score: 75, feedback: 'Slightly off' },
        { name: 'Structure', score: 82, feedback: 'Well organized' },
        { name: 'Authenticity', score: 74, feedback: 'Needs work' },
      ],
    });
  }),

  http.post('/api/content/:id/score', () => {
    return HttpResponse.json({
      overall_score: 78,
      dimensions: [
        { name: 'Vocabulary', score: 80, feedback: 'Good match' },
        { name: 'Tone', score: 75, feedback: 'Slightly off' },
        { name: 'Structure', score: 82, feedback: 'Well organized' },
        { name: 'Authenticity', score: 74, feedback: 'Needs work' },
      ],
    });
  }),

  http.get('/api/content/:id/versions', () => {
    return HttpResponse.json({
      items: [
        {
          id: 'ver-3',
          version_number: 3,
          content_text: 'Latest edited content.',
          trigger: 'inline_edit',
          word_count: 50,
          created_at: NOW,
        },
        {
          id: 'ver-2',
          version_number: 2,
          content_text: 'Regenerated content.',
          trigger: 'regeneration',
          word_count: 35,
          created_at: NOW,
        },
        {
          id: 'ver-1',
          version_number: 1,
          content_text: 'Original generated content.',
          trigger: 'generation',
          word_count: 20,
          created_at: NOW,
        },
      ],
    });
  }),

  http.post('/api/content/:id/restore/:version', ({ params }) => {
    return HttpResponse.json(
      buildContentItem({
        id: params.id as string,
        content_current: 'Restored content.',
      })
    );
  }),

  http.post('/api/content/:id/feedback-regen', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      buildContentItem({
        id: params.id as string,
        content_current: `Improved: ${body.feedback as string}`,
      })
    );
  }),

  http.post('/api/content/:id/partial-regen', async ({ params }) => {
    return HttpResponse.json(
      buildContentItem({
        id: params.id as string,
        content_current: 'Partially regenerated content.',
      })
    );
  }),

  http.post('/api/content/:id/detect', () => {
    return HttpResponse.json({
      risk_level: 'medium',
      confidence: 72,
      flagged_passages: [
        {
          text: 'Furthermore, it is important to note',
          reason: 'Generic transitional phrase common in AI output',
          suggestion: 'Replace with a more natural transition',
        },
      ],
      summary: 'Some AI-like patterns detected.',
    });
  }),

  http.post('/api/content/import', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      buildContentItem({
        id: 'content-imported',
        clone_id: (body.clone_id as string) ?? 'clone-1',
        platform: (body.platform as string) ?? 'blog',
        content_current: (body.content_text as string) ?? 'Imported content.',
        content_original: (body.content_text as string) ?? 'Imported content.',
        input_text: '[Imported]',
        generation_properties: { source: 'import' },
      }),
      { status: 201 }
    );
  }),

  http.post('/api/content/import/upload', async () => {
    return HttpResponse.json(
      buildContentItem({
        id: 'content-uploaded',
        input_text: '[Imported]',
        generation_properties: { source: 'import' },
      }),
      { status: 201 }
    );
  }),

  http.post('/api/content/generate/variants', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      platform: (body.platform as string) ?? 'blog',
      variants: [
        {
          variant_index: 0,
          temperature: 0.5,
          content_text: 'Conservative variant text.',
          word_count: 3,
          char_count: 25,
        },
        {
          variant_index: 1,
          temperature: 0.7,
          content_text: 'Balanced variant text.',
          word_count: 3,
          char_count: 22,
        },
        {
          variant_index: 2,
          temperature: 0.9,
          content_text: 'Creative variant text.',
          word_count: 3,
          char_count: 22,
        },
      ],
      cost_multiplier: 3,
    });
  }),

  http.post('/api/content/variants/select', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      buildContentItem({
        id: 'content-selected',
        clone_id: (body.clone_id as string) ?? 'clone-1',
        platform: (body.platform as string) ?? 'blog',
        content_current: (body.content_text as string) ?? 'Selected variant.',
        content_original: (body.content_text as string) ?? 'Selected variant.',
        input_text: (body.input_text as string) ?? 'Write something.',
      }),
      { status: 201 }
    );
  }),
];
