import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { buildClone, buildContent } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { LibraryPage } from './LibraryPage';

function mockContentAndClones(
  items = [
    buildContent({
      id: 'c1',
      clone_id: 'clone-1',
      platform: 'linkedin',
      status: 'draft',
      content_current: 'Short content for LinkedIn.',
      authenticity_score: 85,
      created_at: '2026-01-15T10:00:00Z',
    }),
    buildContent({
      id: 'c2',
      clone_id: 'clone-2',
      platform: 'twitter',
      status: 'published',
      content_current: 'Tweet text here.',
      authenticity_score: null,
      created_at: '2026-01-14T10:00:00Z',
    }),
  ]
) {
  server.use(
    http.get('/api/content', () => {
      return HttpResponse.json({ items, total: items.length });
    }),
    http.get('/api/clones', () => {
      return HttpResponse.json({
        items: [
          buildClone({ id: 'clone-1', name: 'Marketing Voice' }),
          buildClone({ id: 'clone-2', name: 'Technical Writer' }),
        ],
        total: 2,
      });
    })
  );
}

describe('LibraryPage', () => {
  it('shows loading skeleton while data loads', () => {
    mockContentAndClones();
    renderWithProviders(<LibraryPage />);

    expect(screen.getByTestId('library-loading')).toBeInTheDocument();
  });

  it('shows empty state with Create Content link when no content', async () => {
    mockContentAndClones([]);
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText(/no content yet/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /create content/i })).toHaveAttribute(
      'href',
      '/create'
    );
  });

  it('renders content items in data table', async () => {
    mockContentAndClones();
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText('Short content for LinkedIn.')).toBeInTheDocument();
    });
    expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    // Platform labels appear in both filter checkboxes and table cells
    expect(screen.getAllByText('LinkedIn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tweet text here.')).toBeInTheDocument();
    expect(screen.getByText('Technical Writer')).toBeInTheDocument();
    expect(screen.getAllByText('Twitter/X').length).toBeGreaterThanOrEqual(1);
  });

  it('renders status badges with correct text', async () => {
    mockContentAndClones();
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
    expect(screen.getByText('published')).toBeInTheDocument();
  });

  it('shows score number for scored content and -- for unscored', async () => {
    mockContentAndClones();
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
    });
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('navigates to /create/{id} on row click', async () => {
    mockContentAndClones();
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/create/:id" element={<div data-testid="create-page">Editor</div>} />
      </Routes>,
      { initialEntries: ['/library'] }
    );

    await waitFor(() => {
      expect(screen.getByText('Short content for LinkedIn.')).toBeInTheDocument();
    });

    const row = screen.getByText('Short content for LinkedIn.').closest('tr')!;
    await user.click(row);

    await waitFor(() => {
      expect(screen.getByTestId('create-page')).toBeInTheDocument();
    });
  });

  it('sortable column headers render as buttons', async () => {
    mockContentAndClones();
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText('Short content for LinkedIn.')).toBeInTheDocument();
    });

    // Sortable columns should be buttons
    expect(screen.getByRole('button', { name: /platform/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /score/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /date/i })).toBeInTheDocument();

    // Non-sortable columns should NOT be buttons
    const headerRow = screen.getAllByRole('columnheader');
    const contentHeader = headerRow.find((h) => h.textContent === 'Content');
    expect(contentHeader).toBeDefined();
    expect(within(contentHeader!).queryByRole('button')).toBeNull();
  });

  it('truncates content preview to 100 chars', async () => {
    const longText = 'A'.repeat(150);
    mockContentAndClones([
      buildContent({ id: 'c-long', content_current: longText, clone_id: 'clone-1' }),
    ]);
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      const truncated = `${'A'.repeat(100)}…`;
      expect(screen.getByText(truncated)).toBeInTheDocument();
    });
  });

  it('renders status tabs', async () => {
    mockContentAndClones();
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText('Short content for LinkedIn.')).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /draft/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /review/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /approved/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /published/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /archived/i })).toBeInTheDocument();
  });

  it('status tab click sends status filter to API', async () => {
    let lastRequestUrl = '';
    server.use(
      http.get('/api/content', ({ request }) => {
        lastRequestUrl = request.url;
        return HttpResponse.json({ items: [], total: 0 });
      }),
      http.get('/api/clones', () => {
        return HttpResponse.json({
          items: [buildClone({ id: 'clone-1', name: 'Marketing Voice' })],
          total: 1,
        });
      })
    );
    const user = userEvent.setup();

    // Render at /library?status=draft to start with filters active
    // so it doesn't hit the "no content yet" empty state
    renderWithProviders(
      <Routes>
        <Route path="/library" element={<LibraryPage />} />
      </Routes>,
      { initialEntries: ['/library?status=draft'] }
    );

    await waitFor(() => {
      expect(screen.getByText(/no results match filters/i)).toBeInTheDocument();
    });

    // Click the "Published" tab
    await user.click(screen.getByRole('tab', { name: /published/i }));

    await waitFor(() => {
      expect(lastRequestUrl).toContain('status=published');
    });
  });

  it('checkbox selection shows bulk action bar', async () => {
    mockContentAndClones();
    const user = userEvent.setup();
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText('Short content for LinkedIn.')).toBeInTheDocument();
    });

    // Bulk actions bar should not be visible initially
    expect(screen.queryByTestId('bulk-actions')).not.toBeInTheDocument();

    // Click the first row checkbox (Select row)
    const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });
    await user.click(checkboxes[0]);

    // Bulk actions bar should now appear
    await waitFor(() => {
      expect(screen.getByTestId('bulk-actions')).toBeInTheDocument();
    });
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('shows filtered empty state with clear button when filters match nothing', async () => {
    server.use(
      http.get('/api/content', () => {
        return HttpResponse.json({ items: [], total: 0 });
      }),
      http.get('/api/clones', () => {
        return HttpResponse.json({
          items: [buildClone({ id: 'clone-1', name: 'Marketing Voice' })],
          total: 1,
        });
      })
    );

    renderWithProviders(
      <Routes>
        <Route path="/library" element={<LibraryPage />} />
      </Routes>,
      { initialEntries: ['/library?status=review'] }
    );

    await waitFor(() => {
      expect(screen.getByText(/no results match filters/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });
});
