import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { buildClone, buildSample } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { CloneDetailPage } from './CloneDetailPage';

const TEST_CLONE = buildClone({
  id: 'clone-detail-1',
  name: 'Detail Clone',
  type: 'original',
  confidence_score: 80,
});

function renderPage(cloneId = 'clone-detail-1') {
  server.use(
    http.get('/api/clones/:id', () => {
      return HttpResponse.json(TEST_CLONE);
    })
  );

  return renderWithProviders(
    <Routes>
      <Route path="/clones/:id" element={<CloneDetailPage />} />
      <Route path="/clones" element={<div data-testid="clones-list">Clones List</div>} />
    </Routes>,
    { initialEntries: [`/clones/${cloneId}`] }
  );
}

describe('CloneDetailPage', () => {
  it('shows loading state while fetching', () => {
    server.use(http.get('/api/clones/:id', () => new Promise(() => {})));

    renderWithProviders(
      <Routes>
        <Route path="/clones/:id" element={<CloneDetailPage />} />
      </Routes>,
      { initialEntries: ['/clones/clone-1'] }
    );

    expect(screen.getByTestId('clone-detail-loading')).toBeInTheDocument();
  });

  it('displays clone info after loading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Detail Clone')).toBeInTheDocument();
    });
    expect(screen.getByText('original')).toBeInTheDocument();
    expect(screen.getByText('80% — Ready for use')).toBeInTheDocument();
  });

  it('renders three tabs', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Detail Clone')).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /samples/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /voice dna/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /generated content/i })).toBeInTheDocument();
  });

  it('switches tabs', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Detail Clone')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /voice dna/i }));
    expect(screen.getByText(/voice dna analysis/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /generated content/i }));
    expect(screen.getByText(/generated content will appear/i)).toBeInTheDocument();
  });

  it('calls update when name is edited', async () => {
    const user = userEvent.setup();
    let capturedBody: unknown = null;

    server.use(
      http.get('/api/clones/:id', () => HttpResponse.json(TEST_CLONE)),
      http.put('/api/clones/:id', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...TEST_CLONE, ...(capturedBody as object) });
      })
    );

    renderWithProviders(
      <Routes>
        <Route path="/clones/:id" element={<CloneDetailPage />} />
      </Routes>,
      { initialEntries: ['/clones/clone-detail-1'] }
    );

    await waitFor(() => {
      expect(screen.getByText('Detail Clone')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Detail Clone'));
    const input = screen.getByDisplayValue('Detail Clone');
    await user.clear(input);
    await user.type(input, 'Renamed Clone{Enter}');

    await waitFor(() => {
      expect(capturedBody).toEqual(expect.objectContaining({ name: 'Renamed Clone' }));
    });
  });

  it('navigates to /clones after delete', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/clones/:id', () => HttpResponse.json(TEST_CLONE)),
      http.delete('/api/clones/:id', () => new HttpResponse(null, { status: 204 }))
    );

    renderWithProviders(
      <Routes>
        <Route path="/clones/:id" element={<CloneDetailPage />} />
        <Route path="/clones" element={<div data-testid="clones-list">Clones List</div>} />
      </Routes>,
      { initialEntries: ['/clones/clone-detail-1'] }
    );

    await waitFor(() => {
      expect(screen.getByText('Detail Clone')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.getByTestId('clones-list')).toBeInTheDocument();
    });
  });

  it('shows empty sample state on samples tab', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Detail Clone')).toBeInTheDocument();
    });

    // Samples tab is active by default
    await waitFor(() => {
      expect(screen.getByText('No samples yet')).toBeInTheDocument();
    });
  });

  it('shows sample list when samples exist', async () => {
    server.use(
      http.get('/api/clones/:cloneId/samples', () => {
        return HttpResponse.json({
          items: [
            buildSample({ id: 's-1', content_type: 'blog_post', word_count: 200 }),
            buildSample({ id: 's-2', content_type: 'tweet', word_count: 30 }),
          ],
          total: 2,
        });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Detail Clone')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Blog Post')).toBeInTheDocument();
    });
    expect(screen.getByText('Tweet')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});
