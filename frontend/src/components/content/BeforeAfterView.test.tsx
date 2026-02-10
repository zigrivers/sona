import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BeforeAfterView } from './BeforeAfterView';

const defaultProps = {
  inputText: 'Original input text here.',
  editedText: 'Generated output text here.',
  onTextChange: vi.fn(),
};

describe('BeforeAfterView', () => {
  it('renders input text in left pane', () => {
    render(<BeforeAfterView {...defaultProps} />);
    expect(screen.getByText('Original input text here.')).toBeInTheDocument();
  });

  it('left pane is not editable', () => {
    render(<BeforeAfterView {...defaultProps} />);
    // The left pane should be a div, not a textbox
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes).toHaveLength(1); // Only the right pane textarea
  });

  it('renders editable textarea on right with correct value', () => {
    render(<BeforeAfterView {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Generated output text here.');
  });

  it('fires onTextChange when right side is edited', async () => {
    const onTextChange = vi.fn();
    const user = userEvent.setup();
    render(<BeforeAfterView {...defaultProps} onTextChange={onTextChange} />);

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'New text');

    expect(onTextChange).toHaveBeenCalled();
  });

  it('shows "Original Input" and "Generated Output" labels', () => {
    render(<BeforeAfterView {...defaultProps} />);
    expect(screen.getByText('Original Input')).toBeInTheDocument();
    expect(screen.getByText('Generated Output')).toBeInTheDocument();
  });
});
