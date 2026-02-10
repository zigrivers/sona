import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { useUIStore } from '@/stores/ui-store';
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

const demoClone = buildClone({
  name: 'Demo Writer',
  type: 'demo',
  is_demo: true,
  updated_at: '2026-01-10T00:00:00Z',
});
const originalClone = buildClone({
  name: 'Alice Smith',
  type: 'original',
  confidence_score: 85,
  sample_count: 12,
  updated_at: '2026-01-15T00:00:00Z',
});
const mergedClone = buildClone({
  name: 'Bob Jones',
  type: 'merged',
  confidence_score: 70,
  sample_count: 5,
  updated_at: '2026-01-12T00:00:00Z',
});

function setupClones(clones = [originalClone, mergedClone, demoClone]) {
  mockProvidersConfigured();
  server.use(
    http.get('/api/clones', () =>
      HttpResponse.json({ items: clones, total: clones.length })
    )
  );
}

afterEach(() => {
  useUIStore.setState({ hideDemoClones: false });
});

describe('ClonesPage', () => {
  // ── Existing tests (welcome / provider states) ──────────────

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

  it('shows loading skeleton while data loads', () => {
    server.use(
      http.get('/api/providers', () => new Promise(() => {})),
      http.get('/api/clones', () => new Promise(() => {}))
    );

    renderWithProviders(<ClonesPage />);

    expect(screen.getByTestId('clones-loading')).toBeInTheDocument();
  });

  // ── Clone list tests ────────────────────────────────────────

  it('renders clone cards when data is loaded', async () => {
    setupClones();
    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Demo Writer')).toBeInTheDocument();
  });

  it('sorts clones by updated_at descending', async () => {
    setupClones();
    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    const links = screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/clones/'));
    const names = links
      .map((link) => {
        const match = within(link).queryByText(/Alice Smith|Bob Jones|Demo Writer/);
        return match?.textContent;
      })
      .filter(Boolean);
    expect(names).toEqual(['Alice Smith', 'Bob Jones', 'Demo Writer']);
  });

  it('filters clones by search query', async () => {
    setupClones();
    const user = userEvent.setup();
    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search clones...'), 'Alice');

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    expect(screen.queryByText('Demo Writer')).not.toBeInTheDocument();
  });

  it('filters clones by type', async () => {
    setupClones();
    const user = userEvent.setup();
    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Merged' }));

    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.queryByText('Demo Writer')).not.toBeInTheDocument();
  });

  it('hides demo clones when toggle is on', async () => {
    setupClones();
    const user = userEvent.setup();
    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText('Demo Writer')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('switch'));

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.queryByText('Demo Writer')).not.toBeInTheDocument();
  });

  it('shows empty state when no clones exist', async () => {
    setupClones([]);
    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Your First Clone')).toBeInTheDocument();
    });
  });

  it('shows no-matches state when filters exclude everything', async () => {
    setupClones();
    const user = userEvent.setup();
    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search clones...'), 'nonexistent');

    expect(screen.getByText('No clones match your filters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('clears filters when Clear Filters button is clicked', async () => {
    setupClones();
    const user = userEvent.setup();
    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search clones...'), 'nonexistent');
    expect(screen.getByText('No clones match your filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('links cards to clone detail pages', async () => {
    setupClones([originalClone]);
    renderWithProviders(<ClonesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    const cardLink = screen.getByText('Alice Smith').closest('a');
    expect(cardLink).toHaveAttribute('href', `/clones/${originalClone.id}`);
  });
});
