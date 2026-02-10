import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildClone } from '@/test/factories';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/handlers';

import { DeletedClones } from './DeletedClones';

const NOW = '2026-01-15T10:00:00Z';

describe('DeletedClones', () => {
  it('renders deleted clones with restore buttons', async () => {
    const deleted = buildClone({
      name: 'Deleted Voice',
      deleted_at: '2026-01-10T10:00:00Z',
    });
    server.use(
      http.get('/api/clones/deleted', () => {
        return HttpResponse.json({ items: [deleted], total: 1 });
      })
    );

    renderWithProviders(<DeletedClones />);

    await waitFor(() => {
      expect(screen.getByText('Deleted Voice')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument();
  });

  it('shows empty state when no deleted clones', async () => {
    server.use(
      http.get('/api/clones/deleted', () => {
        return HttpResponse.json({ items: [], total: 0 });
      })
    );

    renderWithProviders(<DeletedClones />);

    await waitFor(() => {
      expect(screen.getByText(/no deleted clones/i)).toBeInTheDocument();
    });
  });

  it('displays days remaining for each clone', async () => {
    // 5 days ago = 25 days remaining
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const deleted = buildClone({
      name: 'Recent Delete',
      deleted_at: fiveDaysAgo,
    });
    server.use(
      http.get('/api/clones/deleted', () => {
        return HttpResponse.json({ items: [deleted], total: 1 });
      })
    );

    renderWithProviders(<DeletedClones />);

    await waitFor(() => {
      expect(screen.getByText(/25 days remaining/i)).toBeInTheDocument();
    });
  });

  it('calls restore mutation on button click', async () => {
    const user = userEvent.setup();
    const deleted = buildClone({
      id: 'clone-restore',
      name: 'Restore Me',
      deleted_at: NOW,
    });
    let restored = false;
    server.use(
      http.get('/api/clones/deleted', () => {
        if (restored) {
          return HttpResponse.json({ items: [], total: 0 });
        }
        return HttpResponse.json({ items: [deleted], total: 1 });
      }),
      http.post('/api/clones/:id/restore', () => {
        restored = true;
        return HttpResponse.json({ ...deleted, deleted_at: null });
      })
    );

    renderWithProviders(<DeletedClones />);

    await waitFor(() => {
      expect(screen.getByText('Restore Me')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /restore/i }));

    // After restore, the query should be invalidated and list re-fetched
    await waitFor(() => {
      expect(screen.getByText(/no deleted clones/i)).toBeInTheDocument();
    });
  });

  it('shows delete dialog with 30-day retention message', async () => {
    const user = userEvent.setup();
    const clone = buildClone({ name: 'My Clone' });

    // Import and render CloneHeader to check updated text
    const { CloneHeader } = await import('./CloneHeader');
    renderWithProviders(
      <CloneHeader clone={clone} onUpdate={() => {}} onDelete={() => {}} />
    );

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/permanently deleted after 30 days/i)).toBeInTheDocument();
    });
  });
});
