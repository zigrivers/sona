import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildDna } from '@/test/factories';

import { DnaTimeline } from './DnaTimeline';

const TWO_DAYS_AGO = '2026-01-13T10:00:00Z';
const ONE_DAY_AGO = '2026-01-14T10:00:00Z';
const ONE_HOUR_AGO = '2026-01-15T09:00:00Z';

function buildVersions() {
  // API returns newest-first
  return [
    buildDna({
      id: 'dna-v3',
      version_number: 3,
      trigger: 'manual_edit',
      created_at: ONE_HOUR_AGO,
      prominence_scores: { vocabulary: 0.9, tone: 0.7, humor: 0.3 },
    }),
    buildDna({
      id: 'dna-v2',
      version_number: 2,
      trigger: 'regeneration',
      created_at: ONE_DAY_AGO,
      prominence_scores: { vocabulary: 0.8, tone: 0.9, humor: 0.28 },
    }),
    buildDna({
      id: 'dna-v1',
      version_number: 1,
      trigger: 'initial_analysis',
      created_at: TWO_DAYS_AGO,
      prominence_scores: { vocabulary: 0.5, tone: 0.6, humor: 0.4 },
    }),
  ];
}

describe('DnaTimeline', () => {
  it('renders versions chronologically (oldest first)', () => {
    render(<DnaTimeline versions={buildVersions()} />);

    const versionLabels = screen.getAllByTestId('timeline-version');
    expect(versionLabels[0]).toHaveTextContent('v1');
    expect(versionLabels[1]).toHaveTextContent('v2');
    expect(versionLabels[2]).toHaveTextContent('v3');
  });

  it('first version shows no deltas', () => {
    render(<DnaTimeline versions={buildVersions()} />);

    const entries = screen.getAllByTestId('timeline-entry');
    // First entry (v1) should have no delta chips
    expect(entries[0].querySelectorAll('[data-testid="delta-chip"]')).toHaveLength(0);
  });

  it('positive delta shows green text with +N', () => {
    render(<DnaTimeline versions={buildVersions()} />);

    // v2 vs v1: vocabulary went 0.5 → 0.8 = +30, tone went 0.6 → 0.9 = +30
    const chips = screen.getAllByTestId('delta-chip');
    const positiveChip = chips.find((c) => c.textContent?.includes('+30'));
    expect(positiveChip).toBeDefined();
    expect(positiveChip).toHaveClass('text-green-600');
  });

  it('negative delta shows red text with -N', () => {
    render(<DnaTimeline versions={buildVersions()} />);

    // v3 vs v2: tone went 0.9 → 0.7 = -20
    const chips = screen.getAllByTestId('delta-chip');
    const negativeChip = chips.find((c) => c.textContent?.includes('-20'));
    expect(negativeChip).toBeDefined();
    expect(negativeChip).toHaveClass('text-red-600');
  });

  it('hides insignificant changes (<=5 points)', () => {
    render(<DnaTimeline versions={buildVersions()} />);

    // v3 vs v2: humor went 0.28 → 0.3 = +2 (should be hidden)
    const chips = screen.getAllByTestId('delta-chip');
    const tinyChip = chips.find((c) => c.textContent?.includes('+2'));
    expect(tinyChip).toBeUndefined();
  });

  it('displays trigger badges', () => {
    render(<DnaTimeline versions={buildVersions()} />);

    expect(screen.getByText('Analyzed')).toBeInTheDocument();
    expect(screen.getByText('Regenerated')).toBeInTheDocument();
    expect(screen.getByText('Edited')).toBeInTheDocument();
  });

  it('handles null prominence_scores without crashing', () => {
    const versions = [
      buildDna({
        id: 'dna-v2',
        version_number: 2,
        trigger: 'regeneration',
        prominence_scores: { vocabulary: 0.8 },
      }),
      buildDna({
        id: 'dna-v1',
        version_number: 1,
        trigger: 'initial_analysis',
        prominence_scores: null,
      }),
    ];

    render(<DnaTimeline versions={versions} />);

    // Should render without crashing, no delta chips since prev has null scores
    const entries = screen.getAllByTestId('timeline-entry');
    expect(entries).toHaveLength(2);
    expect(entries[0].querySelectorAll('[data-testid="delta-chip"]')).toHaveLength(0);
    expect(entries[1].querySelectorAll('[data-testid="delta-chip"]')).toHaveLength(0);
  });

  it('renders nothing for empty array', () => {
    const { container } = render(<DnaTimeline versions={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
