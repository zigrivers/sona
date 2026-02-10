import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { AddSampleDialog } from './AddSampleDialog';

function renderDialog(props: Partial<React.ComponentProps<typeof AddSampleDialog>> = {}) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn(),
    isPending: false,
    ...props,
  };
  return { ...renderWithProviders(<AddSampleDialog {...defaultProps} />), ...defaultProps };
}

describe('AddSampleDialog', () => {
  it('renders dialog when open', () => {
    renderDialog();
    expect(screen.getByText('Add Writing Sample')).toBeInTheDocument();
  });

  it('add button disabled when textarea empty', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled();
  });

  it('add button enabled when textarea has content', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText(/paste your writing sample/i), 'Hello world');

    expect(screen.getByRole('button', { name: /^add$/i })).toBeEnabled();
  });

  it('calls onSubmit with content and content_type', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    await user.type(screen.getByPlaceholderText(/paste your writing sample/i), 'My blog post');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      content: 'My blog post',
      content_type: 'blog_post',
      source_type: 'paste',
    });
  });

  it('closes dialog after submit', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.type(screen.getByPlaceholderText(/paste your writing sample/i), 'Some text');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('resets form when reopened', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn();

    const { rerender } = renderWithProviders(
      <AddSampleDialog open={true} onOpenChange={onOpenChange} onSubmit={onSubmit} />
    );

    await user.type(screen.getByPlaceholderText(/paste your writing sample/i), 'Some text');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    // Simulate close and reopen
    rerender(<AddSampleDialog open={false} onOpenChange={onOpenChange} onSubmit={onSubmit} />);
    rerender(<AddSampleDialog open={true} onOpenChange={onOpenChange} onSubmit={onSubmit} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste your writing sample/i)).toHaveValue('');
    });
  });

  it('disables add button when isPending', async () => {
    const user = userEvent.setup();
    renderDialog({ isPending: true });

    await user.type(screen.getByPlaceholderText(/paste your writing sample/i), 'Some text');
    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled();
  });
});
