import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildDna } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { DnaVersionHistory } from './DnaVersionHistory';

const ONE_HOUR_AGO = '2026-01-15T09:00:00Z';
const ONE_DAY_AGO = '2026-01-14T10:00:00Z';
const TWO_DAYS_AGO = '2026-01-13T10:00:00Z';

function buildVersionItems() {
  return {
    items: [
      buildDna({
        id: 'dna-v3',
        version_number: 3,
        trigger: 'manual_edit',
        created_at: ONE_HOUR_AGO,
      }),
      buildDna({
        id: 'dna-v2',
        version_number: 2,
        trigger: 'regeneration',
        created_at: ONE_DAY_AGO,
      }),
      buildDna({
        id: 'dna-v1',
        version_number: 1,
        trigger: 'initial_analysis',
        created_at: TWO_DAYS_AGO,
      }),
    ],
  };
}

describe('DnaVersionHistory', () => {
  it('shows version list with version numbers', async () => {
    server.use(
      http.get('/api/clones/:cloneId/dna/versions', () => HttpResponse.json(buildVersionItems()))
    );

    renderWithProviders(<DnaVersionHistory cloneId="clone-1" />);

    expect(await screen.findByText('v3')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('shows trigger type badges', async () => {
    server.use(
      http.get('/api/clones/:cloneId/dna/versions', () => HttpResponse.json(buildVersionItems()))
    );

    renderWithProviders(<DnaVersionHistory cloneId="clone-1" />);

    expect(await screen.findByText('Edited')).toBeInTheDocument();
    expect(screen.getByText('Regenerated')).toBeInTheDocument();
    expect(screen.getByText('Analyzed')).toBeInTheDocument();
  });

  it('click version shows read-only preview', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/clones/:cloneId/dna/versions', () => HttpResponse.json(buildVersionItems()))
    );

    renderWithProviders(<DnaVersionHistory cloneId="clone-1" />);

    const v2Row = await screen.findByText('v2');
    await user.click(v2Row);

    expect(screen.getByText('Version 2 Preview')).toBeInTheDocument();
    // Should show category data in preview
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
  });

  it('current version is highlighted with no revert button', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/clones/:cloneId/dna/versions', () => HttpResponse.json(buildVersionItems()))
    );

    renderWithProviders(<DnaVersionHistory cloneId="clone-1" />);

    // Click the current version (v3, first in list)
    const v3Row = await screen.findByText('v3');
    await user.click(v3Row);

    expect(screen.getByText('Version 3 Preview')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /revert to this version/i })).not.toBeInTheDocument();
  });

  it('revert calls API with correct version number', async () => {
    const user = userEvent.setup();

    let capturedVersion: string | undefined;
    server.use(
      http.get('/api/clones/:cloneId/dna/versions', () => HttpResponse.json(buildVersionItems())),
      http.post('/api/clones/:cloneId/dna/revert/:version', ({ params }) => {
        capturedVersion = params.version as string;
        return HttpResponse.json(
          buildDna({
            clone_id: 'clone-1',
            trigger: 'revert',
            version_number: 4,
          })
        );
      })
    );

    renderWithProviders(<DnaVersionHistory cloneId="clone-1" />);

    const v2Row = await screen.findByText('v2');
    await user.click(v2Row);

    const revertBtn = screen.getByRole('button', { name: /revert to this version/i });
    await user.click(revertBtn);

    await waitFor(() => {
      expect(capturedVersion).toBe('2');
    });
  });

  it('shows loading skeleton state', () => {
    server.use(
      http.get('/api/clones/:cloneId/dna/versions', () => {
        return new Promise(() => {});
      })
    );

    renderWithProviders(<DnaVersionHistory cloneId="clone-1" />);

    expect(screen.getAllByTestId('version-skeleton').length).toBeGreaterThan(0);
  });

  it('shows empty state', async () => {
    server.use(
      http.get('/api/clones/:cloneId/dna/versions', () => HttpResponse.json({ items: [] }))
    );

    renderWithProviders(<DnaVersionHistory cloneId="clone-1" />);

    expect(await screen.findByText(/no version history/i)).toBeInTheDocument();
  });
});
