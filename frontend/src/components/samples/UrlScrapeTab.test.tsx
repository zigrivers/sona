import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { UrlScrapeTab } from './UrlScrapeTab';

const CLONE_ID = 'clone-1';

function renderTab(props: Partial<React.ComponentProps<typeof UrlScrapeTab>> = {}) {
  const defaultProps = {
    cloneId: CLONE_ID,
    onSuccess: vi.fn(),
    ...props,
  };
  return { ...renderWithProviders(<UrlScrapeTab {...defaultProps} />), ...defaultProps };
}

describe('UrlScrapeTab', () => {
  it('renders URL input and Scrape button', () => {
    renderTab();
    expect(screen.getByPlaceholderText(/https:\/\//i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scrape/i })).toBeInTheDocument();
  });

  it('disables Scrape button when URL is empty', () => {
    renderTab();
    expect(screen.getByRole('button', { name: /scrape/i })).toBeDisabled();
  });

  it('enables Scrape button when URL is entered', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.type(screen.getByPlaceholderText(/https:\/\//i), 'https://example.com');
    expect(screen.getByRole('button', { name: /scrape/i })).toBeEnabled();
  });

  it('calls scrape endpoint and onSuccess on success', async () => {
    const user = userEvent.setup();
    let postBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/clones/:cloneId/samples/url', async ({ request }) => {
        postBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'sample-url',
            clone_id: CLONE_ID,
            content: 'scraped content',
            content_type: 'blog_post',
            content_type_detected: null,
            word_count: 2,
            length_category: null,
            source_type: 'url',
            source_url: 'https://example.com',
            source_filename: null,
            created_at: '2026-01-15T10:00:00Z',
          },
          { status: 201 }
        );
      })
    );

    const { onSuccess } = renderTab();

    await user.type(screen.getByPlaceholderText(/https:\/\//i), 'https://example.com');
    await user.click(screen.getByRole('button', { name: /scrape/i }));

    await waitFor(() => {
      expect(postBody).toEqual({
        url: 'https://example.com',
        content_type: 'blog_post',
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows error message on failure', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/clones/:cloneId/samples/url', () => {
        return HttpResponse.json(
          { detail: 'Could not scrape URL', code: 'SCRAPE_FAILED' },
          { status: 422 }
        );
      })
    );

    renderTab();

    await user.type(screen.getByPlaceholderText(/https:\/\//i), 'https://bad-url.com');
    await user.click(screen.getByRole('button', { name: /scrape/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not scrape url/i)).toBeInTheDocument();
    });
  });
});
