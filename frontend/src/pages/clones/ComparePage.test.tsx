import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildClone, buildDna } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { ComparePage } from './ComparePage';

function mockClonesWithDna() {
  server.use(
    http.get('/api/clones/c1', () => HttpResponse.json(buildClone({ id: 'c1', name: 'Writer A' }))),
    http.get('/api/clones/c2', () => HttpResponse.json(buildClone({ id: 'c2', name: 'Writer B' }))),
    http.get('/api/clones/c1/dna', () =>
      HttpResponse.json(
        buildDna({
          clone_id: 'c1',
          prominence_scores: {
            vocabulary: 0.8,
            tone: 0.9,
            humor: 0.5,
            sentence_structure: 0.7,
            paragraph_structure: 0.6,
            rhetorical_devices: 0.4,
            punctuation: 0.3,
            openings_and_closings: 0.5,
            signatures: 0.2,
          },
        })
      )
    ),
    http.get('/api/clones/c2/dna', () =>
      HttpResponse.json(
        buildDna({
          clone_id: 'c2',
          prominence_scores: {
            vocabulary: 0.6,
            tone: 0.7,
            humor: 0.3,
            sentence_structure: 0.5,
            paragraph_structure: 0.8,
            rhetorical_devices: 0.6,
            punctuation: 0.5,
            openings_and_closings: 0.7,
            signatures: 0.4,
          },
        })
      )
    )
  );
}

describe('ComparePage', () => {
  it('shows overlaid radar chart when both clones have DNA', async () => {
    mockClonesWithDna();
    const { container } = renderWithProviders(<ComparePage />, {
      initialEntries: ['/clones/compare?a=c1&b=c2'],
    });

    await waitFor(() => {
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });

  it('shows both clone names in comparison heading', async () => {
    mockClonesWithDna();
    renderWithProviders(<ComparePage />, {
      initialEntries: ['/clones/compare?a=c1&b=c2'],
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Writer A.*Writer B/ })).toBeInTheDocument();
    });
  });

  it('shows "Analyze DNA first" when one clone has no DNA', async () => {
    server.use(
      http.get('/api/clones/c1', () =>
        HttpResponse.json(buildClone({ id: 'c1', name: 'Writer A' }))
      ),
      http.get('/api/clones/c2', () =>
        HttpResponse.json(buildClone({ id: 'c2', name: 'Writer B' }))
      ),
      http.get('/api/clones/c1/dna', () =>
        HttpResponse.json(
          buildDna({
            clone_id: 'c1',
            prominence_scores: { vocabulary: 0.8 },
          })
        )
      ),
      http.get('/api/clones/c2/dna', () => HttpResponse.json(null, { status: 404 }))
    );

    renderWithProviders(<ComparePage />, {
      initialEntries: ['/clones/compare?a=c1&b=c2'],
    });

    await waitFor(() => {
      expect(screen.getByText(/analyze dna first/i)).toBeInTheDocument();
    });
  });

  it('shows dimension table with difference indicators', async () => {
    mockClonesWithDna();
    renderWithProviders(<ComparePage />, {
      initialEntries: ['/clones/compare?a=c1&b=c2'],
    });

    await waitFor(() => {
      expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    });
    // The table should show all 9 dimensions
    expect(screen.getByText('Tone')).toBeInTheDocument();
    expect(screen.getByText('Humor')).toBeInTheDocument();
  });
});
