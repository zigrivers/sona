import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { ProvidersPage } from './ProvidersPage';

describe('ProvidersPage', () => {
  it('renders page heading', async () => {
    renderWithProviders(<ProvidersPage />);

    expect(screen.getByRole('heading', { name: /providers/i })).toBeInTheDocument();
  });

  it('renders three provider cards after loading', async () => {
    renderWithProviders(<ProvidersPage />);

    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
    });

    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('Google AI')).toBeInTheDocument();
  });

  it('shows configured status for providers with keys', async () => {
    server.use(
      http.get('/api/providers', () => {
        return HttpResponse.json([
          {
            name: 'openai',
            is_configured: true,
            masked_key: '****abcd',
            default_model: 'gpt-4o',
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
      })
    );

    renderWithProviders(<ProvidersPage />);

    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
    });

    const badges = screen.getAllByText(/not configured/i);
    expect(badges).toHaveLength(2);
    expect(screen.getByText('Configured')).toBeInTheDocument();
  });
});
