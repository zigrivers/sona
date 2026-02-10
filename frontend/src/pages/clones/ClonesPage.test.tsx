import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildClone, buildProvider } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { ClonesPage } from './ClonesPage';

function mockProvidersConfigured() {
  server.use(
    http.get('/api/providers', () => {
      return HttpResponse.json([
        buildProvider({ name: 'openai', is_configured: true, masked_key: '****-key' }),
      ]);
    })
  );
}

function mockProvidersUnconfigured() {
  server.use(
    http.get('/api/providers', () => {
      return HttpResponse.json([
        buildProvider({ name: 'openai', is_configured: false }),
        buildProvider({ name: 'anthropic', is_configured: false }),
      ]);
    })
  );
}

function mockDemoClones() {
  server.use(
    http.get('/api/clones', () => {
      return HttpResponse.json({
        items: [
          buildClone({ name: 'Tech Blogger', is_demo: true }),
          buildClone({ name: 'Podcast Host', is_demo: true }),
          buildClone({ name: 'Newsletter Writer', is_demo: true }),
        ],
        total: 3,
      });
    })
  );
}

describe('ClonesPage', () => {
  it('shows welcome state when no provider configured', async () => {
    mockProvidersUnconfigured();

    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText(/welcome to sona/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /set up ai provider/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /explore demo voices/i })).toBeInTheDocument();
  });

  it('setup CTA links to /settings/providers', async () => {
    mockProvidersUnconfigured();

    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /set up ai provider/i })).toHaveAttribute(
        'href',
        '/settings/providers'
      );
    });
  });

  it('shows demo clones when provider is configured', async () => {
    mockProvidersConfigured();
    mockDemoClones();

    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText('Tech Blogger')).toBeInTheDocument();
    });
    expect(screen.getByText('Podcast Host')).toBeInTheDocument();
    expect(screen.getByText('Newsletter Writer')).toBeInTheDocument();
  });

  it('shows Create Your First Clone CTA when provider configured', async () => {
    mockProvidersConfigured();
    mockDemoClones();

    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /create your first clone/i })).toBeInTheDocument();
    });
  });

  it('shows loading skeleton while data loads', () => {
    server.use(
      http.get('/api/providers', () => new Promise(() => {})),
      http.get('/api/clones', () => new Promise(() => {}))
    );

    renderWithProviders(<ClonesPage />);

    expect(screen.getByTestId('clones-loading')).toBeInTheDocument();
  });
});
