import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { BulkActions } from './BulkActions';

describe('BulkActions', () => {
  it('renders nothing when no items are selected', () => {
    const { container } = renderWithProviders(
      <BulkActions selectedIds={[]} onComplete={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows count and action buttons when items are selected', () => {
    renderWithProviders(<BulkActions selectedIds={['c1', 'c2', 'c3']} onComplete={vi.fn()} />);

    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Change status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add tags/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('delete button opens confirmation dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BulkActions selectedIds={['c1', 'c2']} onComplete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(screen.getByText(/delete content/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/2 items/i)).toBeInTheDocument();
  });

  it('confirm delete calls bulk delete endpoint', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    let deletedIds: string[] = [];

    server.use(
      http.post('/api/content/bulk/delete', async ({ request }) => {
        const body = (await request.json()) as { ids: string[] };
        deletedIds = body.ids;
        return HttpResponse.json({ deleted: body.ids.length });
      })
    );

    renderWithProviders(<BulkActions selectedIds={['c1', 'c2']} onComplete={onComplete} />);

    // Open dialog
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/delete content/i)).toBeInTheDocument();
    });

    // Confirm delete — find the destructive delete button inside the dialog
    const dialogButtons = screen.getAllByRole('button', { name: /delete/i });
    const confirmButton = dialogButtons.find((btn) => btn.closest('[data-slot="dialog-content"]'))!;
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deletedIds).toEqual(['c1', 'c2']);
    });
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
