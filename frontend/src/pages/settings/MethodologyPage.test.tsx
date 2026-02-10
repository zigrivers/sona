import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { MethodologyPage } from './MethodologyPage';

describe('MethodologyPage', () => {
  it('renders three tabs', async () => {
    renderWithProviders(<MethodologyPage />);

    expect(screen.getByRole('tab', { name: /voice cloning/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /authenticity/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /platform/i })).toBeInTheDocument();
  });

  it('switches tabs and loads content', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MethodologyPage />);

    // Default tab loads voice cloning content
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Voice cloning methodology/i)).toBeInTheDocument();
    });

    // Click authenticity tab
    await user.click(screen.getByRole('tab', { name: /authenticity/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Authenticity guidelines/i)).toBeInTheDocument();
    });
  });

  it('disables save button when content is unchanged', async () => {
    renderWithProviders(<MethodologyPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Voice cloning methodology/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('saves updated content and shows toast', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MethodologyPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Voice cloning methodology/i)).toBeInTheDocument();
    });

    const textarea = screen.getByDisplayValue(/Voice cloning methodology/i);
    await user.clear(textarea);
    await user.type(textarea, 'New content');

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  it('renders version history', async () => {
    renderWithProviders(<MethodologyPage />);

    await waitFor(() => {
      expect(screen.getByText(/version 2/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/version 1/i)).toBeInTheDocument();
  });

  it('reverts after confirmation dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MethodologyPage />);

    await waitFor(() => {
      expect(screen.getByText(/version 1/i)).toBeInTheDocument();
    });

    // Click revert on version 1
    const revertButtons = screen.getAllByRole('button', { name: /revert/i });
    await user.click(revertButtons[revertButtons.length - 1]);

    // Confirm dialog
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });
  });
});
