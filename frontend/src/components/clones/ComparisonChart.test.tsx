import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ProminenceScores } from '@/types/dna';

import { ComparisonChart } from './ComparisonChart';

const scoresA: ProminenceScores = { vocabulary: 0.8, tone: 0.9, humor: 0.5 };
const scoresB: ProminenceScores = { vocabulary: 0.6, tone: 0.7, humor: 0.3 };

describe('ComparisonChart', () => {
  it('renders the chart container', () => {
    const { container } = render(
      <ComparisonChart scoresA={scoresA} scoresB={scoresB} nameA="Writer A" nameB="Writer B" />
    );

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('passes clone names as data attributes for legend identification', () => {
    render(
      <ComparisonChart scoresA={scoresA} scoresB={scoresB} nameA="Writer A" nameB="Writer B" />
    );

    expect(screen.getByTestId('comparison-chart')).toHaveAttribute('data-name-a', 'Writer A');
    expect(screen.getByTestId('comparison-chart')).toHaveAttribute('data-name-b', 'Writer B');
  });
});
