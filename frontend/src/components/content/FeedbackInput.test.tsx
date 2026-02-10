import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FeedbackInput } from './FeedbackInput';

const defaultProps = {
  onSubmit: vi.fn(),
  isLoading: false,
};

describe('FeedbackInput', () => {
  it('renders input and submit button', () => {
    render(<FeedbackInput {...defaultProps} />);
    expect(screen.getByPlaceholderText(/feedback/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /improve/i })).toBeInTheDocument();
  });

  it('button is disabled when input is empty', () => {
    render(<FeedbackInput {...defaultProps} />);
    expect(screen.getByRole('button', { name: /improve/i })).toBeDisabled();
  });

  it('button is disabled when loading', async () => {
    const user = userEvent.setup();
    render(<FeedbackInput {...defaultProps} isLoading={true} />);
    const input = screen.getByPlaceholderText(/feedback/i);
    await user.type(input, 'Some feedback');
    expect(screen.getByRole('button', { name: /improve/i })).toBeDisabled();
  });

  it('calls onSubmit with text and clears input', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<FeedbackInput {...defaultProps} onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText(/feedback/i);
    await user.type(input, 'Make it shorter');
    await user.click(screen.getByRole('button', { name: /improve/i }));

    expect(onSubmit).toHaveBeenCalledWith('Make it shorter');
    expect(input).toHaveValue('');
  });

  it('submits on Enter key', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<FeedbackInput {...defaultProps} onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText(/feedback/i);
    await user.type(input, 'Add humor{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('Add humor');
    expect(input).toHaveValue('');
  });

  it('button is disabled when explicitly disabled', async () => {
    const user = userEvent.setup();
    render(<FeedbackInput {...defaultProps} disabled={true} />);
    const input = screen.getByPlaceholderText(/feedback/i);
    await user.type(input, 'Some feedback');
    expect(screen.getByRole('button', { name: /improve/i })).toBeDisabled();
  });
});
