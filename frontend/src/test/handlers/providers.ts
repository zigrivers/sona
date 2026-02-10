import { http, HttpResponse } from 'msw';

export const providerHandlers = [
  http.get('/api/providers', () => {
    return HttpResponse.json([
      {
        name: 'openai',
        is_configured: false,
        masked_key: null,
        default_model: null,
        available_models: ['gpt-4o', 'gpt-4o-mini'],
      },
      {
        name: 'anthropic',
        is_configured: false,
        masked_key: null,
        default_model: null,
        available_models: ['claude-sonnet-4-5-20250929'],
      },
      {
        name: 'google',
        is_configured: false,
        masked_key: null,
        default_model: null,
        available_models: ['gemini-2.0-flash'],
      },
    ]);
  }),

  http.put('/api/providers/default', async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({
      name: body.name,
      is_configured: true,
      masked_key: '****-key',
      default_model: 'gpt-4o',
      available_models: ['gpt-4o', 'gpt-4o-mini'],
    });
  }),

  http.put('/api/providers/:name', async ({ params }) => {
    return HttpResponse.json({
      name: params.name,
      is_configured: true,
      masked_key: '****-key',
      default_model: 'gpt-4o',
      available_models: ['gpt-4o', 'gpt-4o-mini'],
    });
  }),

  http.post('/api/providers/:name/test', () => {
    return HttpResponse.json({
      success: true,
      message: 'Connection successful',
    });
  }),
];
