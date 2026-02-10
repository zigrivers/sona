import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildSample } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { SampleList } from './SampleList';

const CLONE_ID = 'clone-1';

function renderList() {
  return renderWithProviders(<SampleList cloneId={CLONE_ID} />);
}

describe('SampleList', () => {
  it('shows empty state when no samples', async () => {
    renderList();

    await waitFor(() => {
      expect(screen.getByText('No samples yet')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /add sample/i })).toBeInTheDocument();
  });

  it('renders sample rows', async () => {
    const samples = [
      buildSample({ id: 's-1', content_type: 'blog_post', word_count: 150, source_type: 'paste' }),
      buildSample({ id: 's-2', content_type: 'tweet', word_count: 25, source_type: 'paste' }),
    ];

    server.use(
      http.get('/api/clones/:cloneId/samples', () => {
        return HttpResponse.json({ items: samples, total: 2 });
      })
    );

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Blog Post')).toBeInTheDocument();
    });
    expect(screen.getByText('Tweet')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('opens add dialog when Add Sample clicked', async () => {
    const user = userEvent.setup();
    renderList();

    await waitFor(() => {
      expect(screen.getByText('No samples yet')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add sample/i }));

    await waitFor(() => {
      expect(screen.getByText('Add Writing Sample')).toBeInTheDocument();
    });
  });

  it('creates sample via dialog', async () => {
    const user = userEvent.setup();
    let postCalled = false;

    server.use(
      http.post('/api/clones/:cloneId/samples', async ({ request }) => {
        postCalled = true;
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          buildSample({
            content: body.content as string,
            content_type: body.content_type as string,
          }),
          { status: 201 }
        );
      })
    );

    renderList();

    await waitFor(() => {
      expect(screen.getByText('No samples yet')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add sample/i }));

    await waitFor(() => {
      expect(screen.getByText('Add Writing Sample')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/paste your writing sample/i), 'My new sample');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(postCalled).toBe(true);
    });
  });

  it('shows delete confirmation', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/clones/:cloneId/samples', () => {
        return HttpResponse.json({
          items: [buildSample({ id: 's-1' })],
          total: 1,
        });
      })
    );

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Blog Post')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  it('deletes sample on confirm', async () => {
    const user = userEvent.setup();
    let deleteCalled = false;

    server.use(
      http.get('/api/clones/:cloneId/samples', () => {
        return HttpResponse.json({
          items: [buildSample({ id: 's-del' })],
          total: 1,
        });
      }),
      http.delete('/api/clones/:cloneId/samples/:sampleId', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Blog Post')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });

  it('cancels delete', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/clones/:cloneId/samples', () => {
        return HttpResponse.json({
          items: [buildSample({ id: 's-1' })],
          total: 1,
        });
      })
    );

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Blog Post')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });

    // Item still visible
    expect(screen.getByText('Blog Post')).toBeInTheDocument();
  });
});
