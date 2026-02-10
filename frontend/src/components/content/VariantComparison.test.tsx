import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildVariant } from '@/test/factories';
import { renderWithProviders } from '@/test/render';

import { VariantComparison } from './VariantComparison';

const VARIANTS = [
  buildVariant({
    variant_index: 0,
    temperature: 0.5,
    content_text: 'Conservative text.',
    word_count: 2,
    char_count: 19,
  }),
  buildVariant({
    variant_index: 1,
    temperature: 0.7,
    content_text: 'Balanced text.',
    word_count: 2,
    char_count: 14,
  }),
  buildVariant({
    variant_index: 2,
    temperature: 0.9,
    content_text: 'Creative text.',
    word_count: 2,
    char_count: 14,
  }),
];

describe('VariantComparison', () => {
  it('renders all three variant cards', () => {
    renderWithProviders(
      <VariantComparison variants={VARIANTS} onSelect={vi.fn()} onDismiss={vi.fn()} />
    );

    expect(screen.getByText('Conservative')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('Creative')).toBeInTheDocument();
  });

  it('displays word count per variant', () => {
    renderWithProviders(
      <VariantComparison variants={VARIANTS} onSelect={vi.fn()} onDismiss={vi.fn()} />
    );

    const wordCounts = screen.getAllByText(/2 words/i);
    expect(wordCounts).toHaveLength(3);
  });

  it('shows 3x generation cost badge', () => {
    renderWithProviders(
      <VariantComparison variants={VARIANTS} onSelect={vi.fn()} onDismiss={vi.fn()} />
    );

    expect(screen.getByText(/3x generation cost/i)).toBeInTheDocument();
  });

  it('select button disabled without selection', () => {
    renderWithProviders(
      <VariantComparison variants={VARIANTS} onSelect={vi.fn()} onDismiss={vi.fn()} />
    );

    const selectBtn = screen.getByRole('button', { name: /use selected variant/i });
    expect(selectBtn).toBeDisabled();
  });

  it('select button enabled after clicking variant', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <VariantComparison variants={VARIANTS} onSelect={vi.fn()} onDismiss={vi.fn()} />
    );

    await user.click(screen.getByText('Conservative text.'));

    const selectBtn = screen.getByRole('button', { name: /use selected variant/i });
    expect(selectBtn).not.toBeDisabled();
  });

  it('calls onSelect with correct variant', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <VariantComparison variants={VARIANTS} onSelect={onSelect} onDismiss={vi.fn()} />
    );

    await user.click(screen.getByText('Balanced text.'));
    await user.click(screen.getByRole('button', { name: /use selected variant/i }));

    expect(onSelect).toHaveBeenCalledWith(VARIANTS[1]);
  });

  it('calls onDismiss on dismiss click', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <VariantComparison variants={VARIANTS} onSelect={vi.fn()} onDismiss={onDismiss} />
    );

    await user.click(screen.getByRole('button', { name: /dismiss all/i }));

    expect(onDismiss).toHaveBeenCalled();
  });
});
