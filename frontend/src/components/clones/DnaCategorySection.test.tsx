import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Accordion } from '@/components/ui/accordion';

import { DnaCategorySection } from './DnaCategorySection';

function renderSection(overrides: Partial<React.ComponentProps<typeof DnaCategorySection>> = {}) {
  const defaults = {
    categoryKey: 'vocabulary',
    categoryLabel: 'Vocabulary',
    fields: [
      { key: 'complexity_level', label: 'Complexity Level', type: 'text' as const },
      { key: 'jargon_usage', label: 'Jargon Usage', type: 'text' as const },
    ],
    data: { complexity_level: 'intermediate', jargon_usage: 'moderate' },
    onFieldSave: vi.fn(),
    isSaving: false,
  };

  return render(
    <Accordion type="multiple" defaultValue={['vocabulary']}>
      <DnaCategorySection {...defaults} {...overrides} />
    </Accordion>
  );
}

describe('DnaCategorySection', () => {
  it('renders category label', () => {
    renderSection();
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
  });

  it('renders all fields with their values', () => {
    renderSection();
    expect(screen.getByText('Complexity Level')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
    expect(screen.getByText('Jargon Usage')).toBeInTheDocument();
    expect(screen.getByText('moderate')).toBeInTheDocument();
  });

  it('calls onFieldSave with field key and new value', async () => {
    const user = userEvent.setup();
    const onFieldSave = vi.fn();
    renderSection({ onFieldSave });

    await user.click(screen.getByText('intermediate'));
    const input = screen.getByDisplayValue('intermediate');
    await user.clear(input);
    await user.type(input, 'advanced');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onFieldSave).toHaveBeenCalledWith('complexity_level', 'advanced');
  });

  it('renders "Not set" for missing field values', () => {
    renderSection({ data: {} });
    expect(screen.getAllByText('Not set')).toHaveLength(2);
  });
});
