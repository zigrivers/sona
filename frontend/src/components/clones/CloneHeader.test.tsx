import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildClone } from '@/test/factories';
import { renderWithProviders } from '@/test/render';

import { CloneHeader } from './CloneHeader';

describe('CloneHeader', () => {
  it('displays clone name and type badge', () => {
    const clone = buildClone({ name: 'My Voice', type: 'original' });
    renderWithProviders(<CloneHeader clone={clone} onUpdate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('My Voice')).toBeInTheDocument();
    expect(screen.getByText('original')).toBeInTheDocument();
  });

  it('displays confidence badge', () => {
    const clone = buildClone({ confidence_score: 75 });
    renderWithProviders(<CloneHeader clone={clone} onUpdate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('75% — Needs improvement')).toBeInTheDocument();
  });

  it('enters edit mode on name click and saves on Enter', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const clone = buildClone({ name: 'Old Name' });
    renderWithProviders(<CloneHeader clone={clone} onUpdate={onUpdate} onDelete={vi.fn()} />);

    await user.click(screen.getByText('Old Name'));
    const input = screen.getByDisplayValue('Old Name');
    await user.clear(input);
    await user.type(input, 'New Name{Enter}');

    expect(onUpdate).toHaveBeenCalledWith({ name: 'New Name' });
  });

  it('cancels edit on Escape', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const clone = buildClone({ name: 'Original' });
    renderWithProviders(<CloneHeader clone={clone} onUpdate={onUpdate} onDelete={vi.fn()} />);

    await user.click(screen.getByText('Original'));
    const input = screen.getByDisplayValue('Original');
    await user.clear(input);
    await user.type(input, 'Changed{Escape}');

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('opens delete dialog and confirms deletion', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const clone = buildClone({ name: 'My Clone' });
    renderWithProviders(<CloneHeader clone={clone} onUpdate={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('opens delete dialog and cancels', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const clone = buildClone({ name: 'Keep Me' });
    renderWithProviders(<CloneHeader clone={clone} onUpdate={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('does not save when name is empty', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const clone = buildClone({ name: 'Has Name' });
    renderWithProviders(<CloneHeader clone={clone} onUpdate={onUpdate} onDelete={vi.fn()} />);

    await user.click(screen.getByText('Has Name'));
    const input = screen.getByDisplayValue('Has Name');
    await user.clear(input);
    await user.type(input, '{Enter}');

    expect(onUpdate).not.toHaveBeenCalled();
  });
});
