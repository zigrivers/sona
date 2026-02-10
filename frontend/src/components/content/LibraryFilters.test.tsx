import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { buildClone } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { LibraryFilters, type LibraryFiltersState } from './LibraryFilters';

function mockClones() {
  server.use(
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

function renderFilters(filters: LibraryFiltersState = {}, onFiltersChange = vi.fn()) {
  mockClones();
  renderWithProviders(<LibraryFilters filters={filters} onFiltersChange={onFiltersChange} />);
  return { onFiltersChange };
}

describe('LibraryFilters', () => {
  it('renders clone dropdown, platform checkboxes, and search input', () => {
    renderFilters();

    expect(screen.getByLabelText('Filter by clone')).toBeInTheDocument();
    expect(screen.getByLabelText('Search content')).toBeInTheDocument();

    // Platform checkboxes render synchronously
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter/X')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Blog Post')).toBeInTheDocument();
    expect(screen.getByLabelText('Generic')).toBeInTheDocument();
  });

  it('platform checkbox calls onFiltersChange with platform', async () => {
    const { onFiltersChange } = renderFilters();
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('LinkedIn'));

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ platform: 'linkedin' }));
  });

  it('calls onFiltersChange with search after debounce', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onFiltersChange = vi.fn();
    renderFilters({}, onFiltersChange);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    const searchInput = screen.getByLabelText('Search content');
    await user.type(searchInput, 'hello');

    // Should not have fired for final value yet (each keystroke resets the debounce)
    const callsBeforeDebounce = onFiltersChange.mock.calls.length;

    // Advance past debounce
    await act(() => {
      vi.advanceTimersByTime(300);
    });

    // The last call should contain the full search string
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'hello' }));
    expect(onFiltersChange.mock.calls.length).toBeGreaterThan(callsBeforeDebounce);

    vi.useRealTimers();
  });

  it('clear filters button resets all filters', async () => {
    const { onFiltersChange } = renderFilters({
      clone_id: 'clone-1',
      platform: 'linkedin',
      search: 'test',
    });
    const user = userEvent.setup();

    const clearBtn = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearBtn);

    expect(onFiltersChange).toHaveBeenCalledWith({});
  });
});
