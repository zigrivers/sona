import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { CloneForm } from './CloneForm';

describe('CloneForm', () => {
  it('shows validation error when submitting with empty name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloneForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data on valid submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<CloneForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'My Clone');
    await user.type(screen.getByLabelText(/description/i), 'A test clone');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'My Clone',
        description: 'A test clone',
        tags: [],
      });
    });
  });

  it('adds a tag when typing and pressing Enter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloneForm onSubmit={vi.fn()} />);

    const tagInput = screen.getByPlaceholderText(/add a tag/i);
    await user.type(tagInput, 'formal{Enter}');

    expect(screen.getByText('formal')).toBeInTheDocument();
  });

  it('removes a tag when clicking its remove button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloneForm onSubmit={vi.fn()} />);

    const tagInput = screen.getByPlaceholderText(/add a tag/i);
    await user.type(tagInput, 'formal{Enter}');
    expect(screen.getByText('formal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove formal/i }));
    expect(screen.queryByText('formal')).not.toBeInTheDocument();
  });

  it('includes tags in submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<CloneForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'Tagged Clone');
    const tagInput = screen.getByPlaceholderText(/add a tag/i);
    await user.type(tagInput, 'formal{Enter}');
    await user.type(tagInput, 'business{Enter}');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Tagged Clone',
        description: '',
        tags: ['formal', 'business'],
      });
    });
  });

  it('disables submit button when loading', () => {
    renderWithProviders(<CloneForm onSubmit={vi.fn()} isLoading />);

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
  });

  it('does not add duplicate tags', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloneForm onSubmit={vi.fn()} />);

    const tagInput = screen.getByPlaceholderText(/add a tag/i);
    await user.type(tagInput, 'formal{Enter}');
    await user.type(tagInput, 'formal{Enter}');

    const badges = screen.getAllByText('formal');
    expect(badges).toHaveLength(1);
  });
});
