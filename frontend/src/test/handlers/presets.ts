import { http, HttpResponse } from 'msw';

const NOW = '2026-01-15T10:00:00Z';

let presets: Record<string, unknown>[] = [];
let nextId = 1;

function resetPresets() {
  presets = [];
  nextId = 1;
}

export const presetHandlers = [
  http.get('/api/presets', () => {
    return HttpResponse.json(presets);
  }),

  http.post('/api/presets', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const preset = {
      id: `preset-${nextId++}`,
      name: body.name,
      properties: body.properties ?? {},
      created_at: NOW,
      updated_at: NOW,
    };
    presets.push(preset);
    return HttpResponse.json(preset, { status: 201 });
  }),

  http.put('/api/presets/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const existing = presets.find((p) => p.id === params.id);
    if (!existing) {
      return new HttpResponse(null, { status: 404 });
    }
    if (body.name !== undefined) existing.name = body.name;
    if (body.properties !== undefined) existing.properties = body.properties;
    existing.updated_at = NOW;
    return HttpResponse.json(existing);
  }),

  http.delete('/api/presets/:id', ({ params }) => {
    const idx = presets.findIndex((p) => p.id === params.id);
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    presets.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export { resetPresets };
