import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConfidenceBreakdown } from './ConfidenceBreakdown';

const allComponents = [
  { key: 'word_count', name: 'Word Count', score: 22, maxScore: 30 },
  { key: 'sample_count', name: 'Sample Count', score: 16, maxScore: 20 },
  { key: 'type_variety', name: 'Type Variety', score: 10, maxScore: 15 },
  { key: 'length_mix', name: 'Length Mix', score: 8, maxScore: 10 },
  { key: 'consistency', name: 'Consistency', score: 9, maxScore: 10 },
];

describe('ConfidenceBreakdown', () => {
  it('shows all component names and score fractions', () => {
    render(<ConfidenceBreakdown score={85} components={allComponents} />);

    expect(screen.getByText('Word Count')).toBeInTheDocument();
    expect(screen.getByText('22/30')).toBeInTheDocument();
    expect(screen.getByText('Sample Count')).toBeInTheDocument();
    expect(screen.getByText('16/20')).toBeInTheDocument();
    expect(screen.getByText('Type Variety')).toBeInTheDocument();
    expect(screen.getByText('10/15')).toBeInTheDocument();
    expect(screen.getByText('Length Mix')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('Consistency')).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
  });

  it('shows recommendation when word_count is low', () => {
    const components = allComponents.map((c) => (c.key === 'word_count' ? { ...c, score: 10 } : c));
    render(<ConfidenceBreakdown score={65} components={components} />);

    expect(
      screen.getByText('Add more writing samples to improve voice capture accuracy.')
    ).toBeInTheDocument();
  });

  it('shows recommendation when type_variety is low', () => {
    const components = allComponents.map((c) =>
      c.key === 'type_variety' ? { ...c, score: 5 } : c
    );
    render(<ConfidenceBreakdown score={65} components={components} />);

    expect(
      screen.getByText('Try adding different content types for more complete voice capture.')
    ).toBeInTheDocument();
  });

  it('shows no recommendations when score >= 80', () => {
    render(<ConfidenceBreakdown score={85} components={allComponents} />);

    expect(screen.queryByText(/Add more writing/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Add more samples/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Try adding different/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Add content of varying/)).not.toBeInTheDocument();
    expect(screen.queryByText(/inconsistent voice/)).not.toBeInTheDocument();
  });
});
