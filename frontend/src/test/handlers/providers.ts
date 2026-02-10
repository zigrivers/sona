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
    ]);
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
