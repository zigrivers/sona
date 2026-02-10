import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ProminenceScores } from '@/types/dna';

import { DNA_CATEGORIES } from './dna-categories';
import { buildChartData, DnaRadar } from './DnaRadar';

const ALL_LABELS = DNA_CATEGORIES.map((c) => c.label);

// Recharts relies on SVG measurement APIs absent in jsdom.
// Mock chart components to render testable DOM instead.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  RadarChart: ({ children, data }: { children: React.ReactNode; data: { category: string }[] }) => (
    <div data-testid="radar-chart">
      {data?.map((d) => (
        <span key={d.category} data-testid="radar-data-point">
          {d.category}
        </span>
      ))}
      {children}
    </div>
  ),
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: ({ dataKey }: { dataKey?: string }) => (
    <div data-testid="polar-angle-axis" data-key={dataKey} />
  ),
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Radar: () => <div data-testid="radar" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const fullScores: ProminenceScores = {
  vocabulary: 0.8,
  sentence_structure: 0.6,
  paragraph_structure: 0.5,
  tone: 0.9,
  rhetorical_devices: 0.4,
  punctuation: 0.3,
  openings_and_closings: 0.7,
  humor: 0.5,
  signatures: 0.6,
};

const partialScores: ProminenceScores = {
  vocabulary: 0.8,
  tone: 0.9,
  humor: 0.5,
};

describe('DnaRadar', () => {
  it('renders radar chart with 9 axes', () => {
    render(<DnaRadar scores={fullScores} />);

    for (const label of ALL_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('handles partial scores without crashing', () => {
    render(<DnaRadar scores={partialScores} />);

    // All 9 labels still appear — missing scores default to 0
    for (const label of ALL_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('thumbnail mode hides labels and tooltip', () => {
    render(<DnaRadar scores={fullScores} thumbnail />);

    // Thumbnail skips ResponsiveContainer and PolarAngleAxis
    expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
    expect(screen.queryByTestId('polar-angle-axis')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    // Chart still renders
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  it('shows placeholder when scores are null', () => {
    render(<DnaRadar scores={null} />);

    expect(screen.getByText('No scores available')).toBeInTheDocument();
    expect(screen.queryByTestId('radar-chart')).not.toBeInTheDocument();
  });
});

describe('buildChartData', () => {
  it('maps all 9 categories with defaults for missing scores', () => {
    const data = buildChartData(partialScores);

    expect(data).toHaveLength(9);
    expect(data[0]).toEqual({ category: 'Vocabulary', score: 0.8 });
    expect(data[3]).toEqual({ category: 'Tone', score: 0.9 });
    // Missing category defaults to 0
    expect(data[1]).toEqual({ category: 'Sentence Structure', score: 0 });
  });
});
