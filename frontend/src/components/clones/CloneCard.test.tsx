import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildClone } from '@/test/factories';
import { renderWithProviders } from '@/test/render';

import { CloneCard } from './CloneCard';

function renderCard(overrides: Parameters<typeof buildClone>[0] = {}) {
  const clone = buildClone({
    name: 'Alice Smith',
    type: 'original',
    confidence_score: 85,
    sample_count: 12,
    updated_at: new Date().toISOString(),
    ...overrides,
  });
  return renderWithProviders(<CloneCard clone={clone} />, {
    initialEntries: ['/clones'],
  });
}

describe('CloneCard', () => {
  it('renders clone name', () => {
    renderCard({ name: 'John Doe' });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders initials in avatar fallback', () => {
    renderCard({ name: 'Alice Smith' });
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('renders type badge for original clone', () => {
    renderCard({ type: 'original' });
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('renders type badge for merged clone', () => {
    renderCard({ type: 'merged' });
    expect(screen.getByText('Merged')).toBeInTheDocument();
  });

  it('renders type badge for demo clone', () => {
    renderCard({ type: 'demo' });
    expect(screen.getByText('Demo')).toBeInTheDocument();
  });

  it('renders confidence badge', () => {
    renderCard({ confidence_score: 85 });
    expect(screen.getByText('85% — Ready for use')).toBeInTheDocument();
  });

  it('renders sample count', () => {
    renderCard({ sample_count: 42 });
    expect(screen.getByText('42 samples')).toBeInTheDocument();
  });

  it('renders singular sample count', () => {
    renderCard({ sample_count: 1 });
    expect(screen.getByText('1 sample')).toBeInTheDocument();
  });

  it('links to clone detail page', () => {
    renderCard({ id: 'clone-abc' });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/clones/clone-abc');
  });

  it('is keyboard accessible via link', async () => {
    const user = userEvent.setup();
    renderCard({ id: 'clone-abc' });
    const link = screen.getByRole('link');
    await user.tab();
    expect(link).toHaveFocus();
  });
});
