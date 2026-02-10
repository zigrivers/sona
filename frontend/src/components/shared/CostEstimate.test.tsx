import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CostEstimate } from './CostEstimate';

describe('CostEstimate', () => {
  it('renders formatted cost', () => {
    render(<CostEstimate costUsd={0.03} inputTokens={500} outputTokens={200} />);
    expect(screen.getByText('$0.03 estimated')).toBeInTheDocument();
  });

  it('shows <$0.01 for sub-cent costs', () => {
    render(<CostEstimate costUsd={0.001} inputTokens={10} outputTokens={5} />);
    expect(screen.getByText('<$0.01 estimated')).toBeInTheDocument();
  });

  it('includes token breakdown as tooltip title', () => {
    render(<CostEstimate costUsd={0.05} inputTokens={1000} outputTokens={500} />);
    const el = screen.getByTitle(/1,000 input.*500 output/);
    expect(el).toBeInTheDocument();
  });

  it('includes disclaimer in tooltip title', () => {
    render(<CostEstimate costUsd={0.1} inputTokens={2000} outputTokens={1000} />);
    const el = screen.getByTitle(/estimates are approximate/i);
    expect(el).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(
      <CostEstimate costUsd={0.03} inputTokens={500} outputTokens={200} className="mt-4" />
    );
    expect(container.firstChild).toHaveClass('mt-4');
  });
});
