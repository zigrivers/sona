import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ProminenceScores } from '@/types/dna';

import { DimensionTable, getDifferenceLabel } from './DimensionTable';

const ALL_LABELS = [
  'Vocabulary',
  'Sentence Structure',
  'Paragraph Structure',
  'Tone',
  'Rhetorical Devices',
  'Punctuation',
  'Openings & Closings',
  'Humor',
  'Signatures',
];

describe('DimensionTable', () => {
  it('renders all 9 dimension rows with correct labels', () => {
    const scores: ProminenceScores = { vocabulary: 0.8, tone: 0.6 };
    render(<DimensionTable scoresA={scores} scoresB={scores} nameA="Clone A" nameB="Clone B" />);

    for (const label of ALL_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('shows "Similar" badge for dimensions within 15 points', () => {
    const scoresA: ProminenceScores = { vocabulary: 0.8 };
    const scoresB: ProminenceScores = { vocabulary: 0.9 };
    render(<DimensionTable scoresA={scoresA} scoresB={scoresB} nameA="Clone A" nameB="Clone B" />);

    const vocabRow = screen.getByText('Vocabulary').closest('tr')!;
    expect(within(vocabRow).getByText('Similar')).toBeInTheDocument();
  });

  it('shows "Different" badge for dimensions 15-40 apart', () => {
    const scoresA: ProminenceScores = { vocabulary: 0.5 };
    const scoresB: ProminenceScores = { vocabulary: 0.8 };
    render(<DimensionTable scoresA={scoresA} scoresB={scoresB} nameA="Clone A" nameB="Clone B" />);

    const vocabRow = screen.getByText('Vocabulary').closest('tr')!;
    expect(within(vocabRow).getByText('Different')).toBeInTheDocument();
  });

  it('shows "Very Different" badge for dimensions 40+ apart', () => {
    const scoresA: ProminenceScores = { vocabulary: 0.1 };
    const scoresB: ProminenceScores = { vocabulary: 0.6 };
    render(<DimensionTable scoresA={scoresA} scoresB={scoresB} nameA="Clone A" nameB="Clone B" />);

    const vocabRow = screen.getByText('Vocabulary').closest('tr')!;
    expect(within(vocabRow).getByText('Very Different')).toBeInTheDocument();
  });
});

describe('getDifferenceLabel', () => {
  it('returns Similar for delta < 15', () => {
    expect(getDifferenceLabel(0.8, 0.9)).toBe('Similar');
  });

  it('returns Different for delta 15-40', () => {
    expect(getDifferenceLabel(0.5, 0.8)).toBe('Different');
  });

  it('returns Very Different for delta >= 40', () => {
    expect(getDifferenceLabel(0.1, 0.6)).toBe('Very Different');
  });

  it('returns Similar when both are undefined', () => {
    expect(getDifferenceLabel(undefined, undefined)).toBe('Similar');
  });
});
