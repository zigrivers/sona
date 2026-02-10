import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { ContentVersionHistory } from './ContentVersionHistory';

const NOW = '2026-01-15T10:00:00Z';
const ONE_HOUR_AGO = '2026-01-15T09:00:00Z';
const ONE_DAY_AGO = '2026-01-14T10:00:00Z';

function buildVersionItems() {
  return {
    items: [
      {
        id: 'ver-3',
        version_number: 3,
        content_text: 'Latest edited content with more words.',
        trigger: 'inline_edit',
        word_count: 50,
        created_at: ONE_HOUR_AGO,
      },
      {
        id: 'ver-2',
        version_number: 2,
        content_text: 'Regenerated content text here.',
        trigger: 'regeneration',
        word_count: 35,
        created_at: ONE_DAY_AGO,
      },
      {
        id: 'ver-1',
        version_number: 1,
        content_text: 'Original generated content.',
        trigger: 'generation',
        word_count: 20,
        created_at: NOW,
      },
    ],
  };
}

describe('ContentVersionHistory', () => {
  it('shows version list with version numbers', async () => {
    server.use(http.get('/api/content/:id/versions', () => HttpResponse.json(buildVersionItems())));

    renderWithProviders(<ContentVersionHistory contentId="content-1" />);

    expect(await screen.findByText('v3')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('shows trigger type badges', async () => {
    server.use(http.get('/api/content/:id/versions', () => HttpResponse.json(buildVersionItems())));

    renderWithProviders(<ContentVersionHistory contentId="content-1" />);

    expect(await screen.findByText('Edited')).toBeInTheDocument();
    expect(screen.getByText('Regenerated')).toBeInTheDocument();
    expect(screen.getByText('Generated')).toBeInTheDocument();
  });

  it('shows word count delta between versions', async () => {
    server.use(http.get('/api/content/:id/versions', () => HttpResponse.json(buildVersionItems())));

    renderWithProviders(<ContentVersionHistory contentId="content-1" />);

    // v3: 50 - 35 = +15 words, v2: 35 - 20 = +15 words
    const deltas = await screen.findAllByText('+15 words');
    expect(deltas).toHaveLength(2);
    // v1: baseline, no delta shown
  });

  it('click version shows read-only preview', async () => {
    const user = userEvent.setup();
    server.use(http.get('/api/content/:id/versions', () => HttpResponse.json(buildVersionItems())));

    renderWithProviders(<ContentVersionHistory contentId="content-1" />);

    const v2Row = await screen.findByText('v2');
    await user.click(v2Row);

    expect(screen.getByText('Version 2 Preview')).toBeInTheDocument();
    expect(screen.getByText('Regenerated content text here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restore this version/i })).toBeInTheDocument();
  });

  it('restore calls API with correct version number', async () => {
    const user = userEvent.setup();

    let capturedVersion: string | undefined;
    server.use(
      http.get('/api/content/:id/versions', () => HttpResponse.json(buildVersionItems())),
      http.post('/api/content/:id/restore/:version', ({ params }) => {
        capturedVersion = params.version as string;
        return HttpResponse.json({
          id: 'content-1',
          clone_id: 'clone-1',
          platform: 'linkedin',
          status: 'draft',
          content_current: 'Restored content.',
          content_original: 'Original generated content.',
          input_text: 'Write about testing.',
          generation_properties: null,
          authenticity_score: null,
          score_dimensions: null,
          topic: null,
          campaign: null,
          tags: [],
          word_count: 35,
          char_count: 100,
          preset_id: null,
          created_at: NOW,
          updated_at: NOW,
        });
      })
    );

    renderWithProviders(<ContentVersionHistory contentId="content-1" />);

    const v2Row = await screen.findByText('v2');
    await user.click(v2Row);

    const restoreBtn = screen.getByRole('button', { name: /restore this version/i });
    await user.click(restoreBtn);

    await waitFor(() => {
      expect(capturedVersion).toBe('2');
    });
  });

  it('shows loading skeleton state', () => {
    server.use(
      http.get('/api/content/:id/versions', () => {
        // Never resolves — keeps loading
        return new Promise(() => {});
      })
    );

    renderWithProviders(<ContentVersionHistory contentId="content-1" />);

    expect(screen.getAllByTestId('version-skeleton').length).toBeGreaterThan(0);
  });

  it('shows error state', async () => {
    server.use(
      http.get('/api/content/:id/versions', () =>
        HttpResponse.json({ detail: 'Not found' }, { status: 500 })
      )
    );

    renderWithProviders(<ContentVersionHistory contentId="content-1" />);

    expect(await screen.findByText(/failed to load version history/i)).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    server.use(http.get('/api/content/:id/versions', () => HttpResponse.json({ items: [] })));

    renderWithProviders(<ContentVersionHistory contentId="content-1" />);

    expect(await screen.findByText(/no versions/i)).toBeInTheDocument();
  });
});
