import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { TextPreview } from './TextPreview';

function renderPreview(props: Partial<React.ComponentProps<typeof TextPreview>> = {}) {
  const defaultProps = {
    initialContent: 'Hello world',
    sourceLabel: 'file.txt',
    onSubmit: vi.fn(),
    onBack: vi.fn(),
    isPending: false,
    ...props,
  };
  return { ...renderWithProviders(<TextPreview {...defaultProps} />), ...defaultProps };
}

describe('TextPreview', () => {
  it('renders pre-populated textarea with initial content', () => {
    renderPreview({ initialContent: 'My file content' });
    expect(screen.getByRole('textbox')).toHaveValue('My file content');
  });

  it('shows source label', () => {
    renderPreview({ sourceLabel: 'notes.txt' });
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });

  it('allows editing content', async () => {
    const user = userEvent.setup();
    renderPreview({ initialContent: 'Original' });

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'Edited');

    expect(textarea).toHaveValue('Edited');
  });

  it('calls onSubmit with content and content_type when Add clicked', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderPreview({ initialContent: 'My content' });

    await user.click(screen.getByRole('button', { name: /^add$/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      content: 'My content',
      content_type: 'blog_post',
    });
  });

  it('disables Add when content is empty', async () => {
    const user = userEvent.setup();
    renderPreview({ initialContent: '' });

    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'x');
    expect(screen.getByRole('button', { name: /^add$/i })).toBeEnabled();
  });

  it('disables Add when isPending', () => {
    renderPreview({ initialContent: 'Some text', isPending: true });
    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled();
  });

  it('calls onBack when Back clicked', async () => {
    const user = userEvent.setup();
    const { onBack } = renderPreview();

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalled();
  });
});
