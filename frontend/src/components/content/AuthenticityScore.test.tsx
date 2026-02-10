import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthenticityScore } from './AuthenticityScore';

describe('AuthenticityScore', () => {
  it('shows overall score', () => {
    render(<AuthenticityScore overallScore={78} />);
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  it('green badge when score >= 75', () => {
    const { container } = render(<AuthenticityScore overallScore={85} />);
    expect(container.querySelector('[data-slot="badge"]')).toHaveClass('bg-green-100');
  });

  it('yellow badge when score 50-74', () => {
    const { container } = render(<AuthenticityScore overallScore={60} />);
    expect(container.querySelector('[data-slot="badge"]')).toHaveClass('bg-yellow-100');
  });

  it('red badge when score < 50', () => {
    const { container } = render(<AuthenticityScore overallScore={35} />);
    expect(container.querySelector('[data-slot="badge"]')).toHaveClass('bg-red-100');
  });

  it('shows label text', () => {
    render(<AuthenticityScore overallScore={78} />);
    expect(screen.getByText(/authenticity/i)).toBeInTheDocument();
  });
});
