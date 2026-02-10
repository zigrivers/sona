import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DnaFieldEditor } from './DnaFieldEditor';

describe('DnaFieldEditor', () => {
  it('renders display value for text field', () => {
    render(
      <DnaFieldEditor
        fieldConfig={{ key: 'complexity_level', label: 'Complexity Level', type: 'text' }}
        value="intermediate"
        onSave={vi.fn()}
        isSaving={false}
      />
    );

    expect(screen.getByText('Complexity Level')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('renders comma-joined value for array field', () => {
    render(
      <DnaFieldEditor
        fieldConfig={{ key: 'catchphrases', label: 'Catchphrases', type: 'array' }}
        value={['Hello world', 'Goodbye']}
        onSave={vi.fn()}
        isSaving={false}
      />
    );

    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Goodbye')).toBeInTheDocument();
  });

  it('enters edit mode on click for text field', async () => {
    const user = userEvent.setup();
    render(
      <DnaFieldEditor
        fieldConfig={{ key: 'complexity_level', label: 'Complexity Level', type: 'text' }}
        value="intermediate"
        onSave={vi.fn()}
        isSaving={false}
      />
    );

    await user.click(screen.getByText('intermediate'));
    expect(screen.getByDisplayValue('intermediate')).toBeInTheDocument();
  });

  it('saves on confirm for text field', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <DnaFieldEditor
        fieldConfig={{ key: 'complexity_level', label: 'Complexity Level', type: 'text' }}
        value="intermediate"
        onSave={onSave}
        isSaving={false}
      />
    );

    await user.click(screen.getByText('intermediate'));
    const input = screen.getByDisplayValue('intermediate');
    await user.clear(input);
    await user.type(input, 'advanced');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith('advanced');
  });

  it('cancels edit mode without saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <DnaFieldEditor
        fieldConfig={{ key: 'complexity_level', label: 'Complexity Level', type: 'text' }}
        value="intermediate"
        onSave={onSave}
        isSaving={false}
      />
    );

    await user.click(screen.getByText('intermediate'));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('disables inputs when saving', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DnaFieldEditor
        fieldConfig={{ key: 'complexity_level', label: 'Complexity Level', type: 'text' }}
        value="intermediate"
        onSave={vi.fn()}
        isSaving={false}
      />
    );

    await user.click(screen.getByText('intermediate'));

    rerender(
      <DnaFieldEditor
        fieldConfig={{ key: 'complexity_level', label: 'Complexity Level', type: 'text' }}
        value="intermediate"
        onSave={vi.fn()}
        isSaving={true}
      />
    );

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('renders "not set" when value is undefined', () => {
    render(
      <DnaFieldEditor
        fieldConfig={{ key: 'complexity_level', label: 'Complexity Level', type: 'text' }}
        value={undefined}
        onSave={vi.fn()}
        isSaving={false}
      />
    );

    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  it('handles array field editing with comma-separated input', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <DnaFieldEditor
        fieldConfig={{ key: 'catchphrases', label: 'Catchphrases', type: 'array' }}
        value={['Hello']}
        onSave={onSave}
        isSaving={false}
      />
    );

    await user.click(screen.getByText('Hello'));
    const input = screen.getByDisplayValue('Hello');
    await user.clear(input);
    await user.type(input, 'Hi there, Goodbye');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(['Hi there', 'Goodbye']);
  });
});
