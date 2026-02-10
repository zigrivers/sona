import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { DataPage } from './DataPage';

describe('DataPage', () => {
  it('renders loading skeletons initially', () => {
    renderWithProviders(<DataPage />);

    // Skeletons appear while loading
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders database stats after loading', async () => {
    renderWithProviders(<DataPage />);

    await waitFor(() => {
      expect(screen.getByText('/data/sona.db')).toBeInTheDocument();
    });

    expect(screen.getByText('512.0 KB')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // clone_count
    expect(screen.getByText('12')).toBeInTheDocument(); // content_count
    expect(screen.getByText('7')).toBeInTheDocument(); // sample_count
  });

  it('renders backup and restore buttons', async () => {
    renderWithProviders(<DataPage />);

    expect(screen.getByRole('button', { name: /download backup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restore from file/i })).toBeInTheDocument();
  });

  it('shows confirmation dialog when restore file is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataPage />);

    // Find the hidden file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(['fake-content'], 'backup.db', {
      type: 'application/octet-stream',
    });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/restore database/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /confirm restore/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('closes confirmation dialog on cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataPage />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-content'], 'backup.db', {
      type: 'application/octet-stream',
    });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/restore database/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText(/restore database/i)).not.toBeInTheDocument();
    });
  });

  it('renders all three data transparency sections', () => {
    renderWithProviders(<DataPage />);

    expect(screen.getByText('Stored Locally')).toBeInTheDocument();
    expect(screen.getByText('Sent to LLM Providers')).toBeInTheDocument();
    expect(screen.getByText('Never Sent')).toBeInTheDocument();
  });

  it('renders page title and subtitle', () => {
    renderWithProviders(<DataPage />);

    expect(screen.getByRole('heading', { name: /data & privacy/i })).toBeInTheDocument();
    expect(screen.getByText(/manage your database/i)).toBeInTheDocument();
  });
});
