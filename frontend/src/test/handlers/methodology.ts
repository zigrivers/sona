import { http, HttpResponse } from 'msw';

const NOW = '2026-01-15T10:00:00Z';

const sections: Record<string, { id: string; section_key: string; current_content: string }> = {
  voice_cloning: {
    id: 'method-1',
    section_key: 'voice_cloning',
    current_content: 'Voice cloning methodology instructions.',
  },
  authenticity: {
    id: 'method-2',
    section_key: 'authenticity',
    current_content: 'Authenticity guidelines content.',
  },
  platform_practices: {
    id: 'method-3',
    section_key: 'platform_practices',
    current_content: 'Platform best practices content.',
  },
};

export const methodologyHandlers = [
  http.get('/api/methodology/:section', ({ params }) => {
    const section = sections[params.section as string];
    if (!section) {
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...section,
      created_at: NOW,
      updated_at: NOW,
    });
  }),

  http.put('/api/methodology/:section', async ({ params, request }) => {
    const section = sections[params.section as string];
    if (!section) {
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const updated = {
      ...section,
      current_content: (body.content as string) ?? section.current_content,
      created_at: NOW,
      updated_at: NOW,
    };
    sections[params.section as string] = updated;
    return HttpResponse.json(updated);
  }),

  http.get('/api/methodology/:section/versions', ({ params }) => {
    const section = sections[params.section as string];
    if (!section) {
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json([
      {
        id: 'ver-1',
        settings_id: section.id,
        version_number: 2,
        content: section.current_content,
        trigger: 'manual_edit',
        created_at: NOW,
      },
      {
        id: 'ver-2',
        settings_id: section.id,
        version_number: 1,
        content: 'Original content.',
        trigger: 'seed',
        created_at: NOW,
      },
    ]);
  }),

  http.post('/api/methodology/:section/revert/:version', ({ params }) => {
    const section = sections[params.section as string];
    if (!section) {
      return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...section,
      current_content: 'Reverted content.',
      created_at: NOW,
      updated_at: NOW,
    });
  }),
];
