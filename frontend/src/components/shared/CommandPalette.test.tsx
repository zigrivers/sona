import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUIStore } from '@/stores/ui-store';
import { buildClone } from '@/test/factories';
import { server } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';

import { CommandPalette } from './CommandPalette';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('CommandPalette', () => {
  beforeEach(() => {
    useUIStore.setState({ commandPaletteOpen: false });
    mockNavigate.mockClear();
  });

  it('renders when commandPaletteOpen is true', () => {
    useUIStore.setState({ commandPaletteOpen: true });
    renderWithProviders(<CommandPalette />);

    expect(screen.getByPlaceholderText('Search pages and clones...')).toBeInTheDocument();
  });

  it('does not render dialog content when commandPaletteOpen is false', () => {
    renderWithProviders(<CommandPalette />);

    expect(screen.queryByPlaceholderText('Search pages and clones...')).not.toBeInTheDocument();
  });

  it('filters results when typing', async () => {
    useUIStore.setState({ commandPaletteOpen: true });
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    const input = screen.getByPlaceholderText('Search pages and clones...');
    await user.type(input, 'Libr');

    await waitFor(() => {
      expect(screen.getByText('Content Library')).toBeInTheDocument();
    });
  });

  it('navigates and closes palette on item select', async () => {
    useUIStore.setState({ commandPaletteOpen: true });
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    const item = screen.getByText('Content Library');
    await user.click(item);

    expect(mockNavigate).toHaveBeenCalledWith('/library');
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('shows clones from API', async () => {
    const clone = buildClone({ name: 'Marketing Voice' });
    server.use(http.get('/api/clones', () => HttpResponse.json({ items: [clone], total: 1 })));
    useUIStore.setState({ commandPaletteOpen: true });
    renderWithProviders(<CommandPalette />);

    await waitFor(() => {
      expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    });
  });
});
