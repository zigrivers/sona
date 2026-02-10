import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConfidenceBadge } from './ConfidenceBadge';

describe('ConfidenceBadge', () => {
  it('renders green badge for score >= 80', () => {
    render(<ConfidenceBadge score={90} />);

    const badge = screen.getByText('90% — Ready for use');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-success');
  });

  it('renders yellow badge for score 60-79', () => {
    render(<ConfidenceBadge score={70} />);

    const badge = screen.getByText('70% — Needs improvement');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-warning');
  });

  it('renders red badge for score < 60', () => {
    render(<ConfidenceBadge score={40} />);

    const badge = screen.getByText('40% — Needs samples');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-destructive');
  });

  it('treats exactly 80 as green', () => {
    render(<ConfidenceBadge score={80} />);

    const badge = screen.getByText('80% — Ready for use');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-success');
  });

  it('treats exactly 60 as yellow', () => {
    render(<ConfidenceBadge score={60} />);

    const badge = screen.getByText('60% — Needs improvement');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-warning');
  });
});
