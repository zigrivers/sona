import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildProvider } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { RequiresProvider } from './RequiresProvider';

describe('RequiresProvider', () => {
  it('renders children when a provider is configured', async () => {
    server.use(
      http.get('/api/providers', () => {
        return HttpResponse.json([
          buildProvider({ name: 'openai', is_configured: true, masked_key: '****-key' }),
        ]);
      })
    );

    renderWithProviders(
      <RequiresProvider>
        <button>Analyze DNA</button>
      </RequiresProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analyze dna/i })).toBeInTheDocument();
    });
  });

  it('shows inline message when no provider configured', async () => {
    server.use(
      http.get('/api/providers', () => {
        return HttpResponse.json([
          buildProvider({ name: 'openai', is_configured: false }),
          buildProvider({ name: 'anthropic', is_configured: false }),
        ]);
      })
    );

    renderWithProviders(
      <RequiresProvider>
        <button>Analyze DNA</button>
      </RequiresProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no ai provider configured/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /analyze dna/i })).not.toBeInTheDocument();
  });

  it('shows loading skeleton while providers load', () => {
    server.use(
      http.get('/api/providers', () => {
        // Never responds — simulates pending state
        return new Promise(() => {});
      })
    );

    renderWithProviders(
      <RequiresProvider>
        <button>Analyze DNA</button>
      </RequiresProvider>
    );

    expect(screen.getByTestId('requires-provider-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /analyze dna/i })).not.toBeInTheDocument();
  });

  it('links to /settings/providers', async () => {
    server.use(
      http.get('/api/providers', () => {
        return HttpResponse.json([buildProvider({ name: 'openai', is_configured: false })]);
      })
    );

    renderWithProviders(
      <RequiresProvider>
        <button>Analyze DNA</button>
      </RequiresProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /configure/i })).toHaveAttribute(
        'href',
        '/settings/providers'
      );
    });
  });
});
