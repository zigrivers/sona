import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { DimensionScore } from '@/types/api';

import { DimensionBreakdown } from './DimensionBreakdown';

const dimensions: DimensionScore[] = [
  { name: 'Vocabulary', score: 80, feedback: 'Good vocabulary match' },
  { name: 'Tone', score: 45, feedback: 'Tone needs improvement, try more casual language' },
  { name: 'Structure', score: 90, feedback: 'Well structured content' },
  { name: 'Authenticity', score: 65, feedback: 'Could be more authentic' },
];

describe('DimensionBreakdown', () => {
  it('sorts dimensions by score lowest first', () => {
    render(<DimensionBreakdown dimensions={dimensions} />);
    const names = screen.getAllByTestId('dimension-name').map((el) => el.textContent);
    expect(names).toEqual(['Tone', 'Authenticity', 'Vocabulary', 'Structure']);
  });

  it('shows score for each dimension', () => {
    render(<DimensionBreakdown dimensions={dimensions} />);
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('shows feedback for dimensions below 70 by default', () => {
    render(<DimensionBreakdown dimensions={dimensions} />);
    expect(screen.getByText(/tone needs improvement/i)).toBeInTheDocument();
    expect(screen.getByText(/could be more authentic/i)).toBeInTheDocument();
  });

  it('does not show feedback for dimensions at or above 70 by default', () => {
    render(<DimensionBreakdown dimensions={dimensions} />);
    expect(screen.queryByText(/good vocabulary match/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/well structured/i)).not.toBeInTheDocument();
  });

  it('clicking a dimension >= 70 reveals its feedback', async () => {
    const user = userEvent.setup();
    render(<DimensionBreakdown dimensions={dimensions} />);

    const vocabRow = screen.getByText('Vocabulary').closest('button')!;
    await user.click(vocabRow);

    expect(screen.getByText(/good vocabulary match/i)).toBeInTheDocument();
  });

  it('renders empty when no dimensions', () => {
    const { container } = render(<DimensionBreakdown dimensions={[]} />);
    expect(container.textContent).toBe('');
  });
});
