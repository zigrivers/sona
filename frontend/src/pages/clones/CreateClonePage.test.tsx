import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { CreateClonePage } from './CreateClonePage';

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/clones/new" element={<CreateClonePage />} />
      <Route path="/clones/:id" element={<div data-testid="detail-page">Detail</div>} />
    </Routes>,
    { initialEntries: ['/clones/new'] }
  );
}

describe('CreateClonePage', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /create.*clone/i })).toBeInTheDocument();
  });

  it('renders the clone form', () => {
    renderPage();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('creates clone and navigates to detail page on success', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/clones', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'clone-created',
            name: body.name,
            description: body.description ?? null,
            tags: body.tags ?? [],
            type: 'original',
            is_demo: false,
            is_hidden: false,
            avatar_path: null,
            confidence_score: 0,
            sample_count: 0,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          { status: 201 }
        );
      })
    );

    renderPage();

    await user.type(screen.getByLabelText(/name/i), 'My New Clone');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByTestId('detail-page')).toBeInTheDocument();
    });
  });

  it('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });
});
