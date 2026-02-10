import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildContent } from '@/test/factories';

import { PlatformTab } from './PlatformTab';

const defaultProps = {
  content: buildContent({ platform: 'linkedin', content_current: 'Hello world', char_count: 11 }),
  editedText: 'Hello world',
  onTextChange: vi.fn(),
  onSave: vi.fn(),
  onRegenerate: vi.fn(),
  onCheckScore: vi.fn(),
  isSaving: false,
  isRegenerating: false,
  isScoring: false,
  scoreResult: null as null | {
    overall_score: number;
    dimensions: { name: string; score: number; feedback: string }[];
  },
};

describe('PlatformTab', () => {
  it('renders content in textarea', () => {
    render(<PlatformTab {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Hello world');
  });

  it('shows char count and word count', () => {
    render(<PlatformTab {...defaultProps} />);
    expect(screen.getByText(/11.*\/.*3,000/)).toBeInTheDocument();
    expect(screen.getByText(/2 words/i)).toBeInTheDocument();
  });

  it('shows green indicator when under limit', () => {
    const { container } = render(<PlatformTab {...defaultProps} />);
    expect(container.querySelector('.text-green-600')).toBeInTheDocument();
  });

  it('shows yellow indicator when >80% of limit', () => {
    const text = 'a'.repeat(2500);
    const content = buildContent({ platform: 'linkedin', content_current: text, char_count: 2500 });
    const { container } = render(
      <PlatformTab {...defaultProps} content={content} editedText={text} />
    );
    expect(container.querySelector('.text-yellow-600')).toBeInTheDocument();
  });

  it('shows red indicator when over limit', () => {
    const text = 'a'.repeat(3100);
    const content = buildContent({ platform: 'linkedin', content_current: text, char_count: 3100 });
    const { container } = render(
      <PlatformTab {...defaultProps} content={content} editedText={text} />
    );
    expect(container.querySelector('.text-red-600')).toBeInTheDocument();
  });

  it('twitter: shows thread button when >280 chars', () => {
    const text = 'This is a long tweet. '.repeat(20).trim();
    const content = buildContent({ platform: 'twitter', content_current: text });
    render(<PlatformTab {...defaultProps} content={content} editedText={text} />);
    expect(screen.getByRole('button', { name: /thread/i })).toBeInTheDocument();
  });

  it('twitter: thread conversion displays split chunks', async () => {
    const user = userEvent.setup();
    const text = 'This is a long tweet. '.repeat(20).trim();
    const content = buildContent({ platform: 'twitter', content_current: text });
    render(<PlatformTab {...defaultProps} content={content} editedText={text} />);

    await user.click(screen.getByRole('button', { name: /thread/i }));
    // Should show numbered chunks
    expect(screen.getByText(/1\//)).toBeInTheDocument();
  });

  it('shows unsaved changes indicator when edited', () => {
    render(<PlatformTab {...defaultProps} editedText="Modified text" />);
    expect(screen.getByText(/unsaved/i)).toBeInTheDocument();
  });

  it('does not show unsaved indicator when text matches', () => {
    render(<PlatformTab {...defaultProps} />);
    expect(screen.queryByText(/unsaved/i)).not.toBeInTheDocument();
  });

  it('calls onSave when Save clicked', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<PlatformTab {...defaultProps} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('calls onRegenerate when Regenerate clicked', async () => {
    const onRegenerate = vi.fn();
    const user = userEvent.setup();
    render(<PlatformTab {...defaultProps} onRegenerate={onRegenerate} />);
    await user.click(screen.getByRole('button', { name: /regenerate/i }));
    expect(onRegenerate).toHaveBeenCalledOnce();
  });

  it('shows platform hints', () => {
    render(<PlatformTab {...defaultProps} />);
    // LinkedIn hints should show
    expect(screen.getByText(/3000 character limit/i)).toBeInTheDocument();
  });

  it('shows Check Authenticity button', () => {
    render(<PlatformTab {...defaultProps} />);
    expect(screen.getByRole('button', { name: /check authenticity/i })).toBeInTheDocument();
  });

  it('calls onCheckScore when Check Authenticity clicked', async () => {
    const onCheckScore = vi.fn();
    const user = userEvent.setup();
    render(<PlatformTab {...defaultProps} onCheckScore={onCheckScore} />);
    await user.click(screen.getByRole('button', { name: /check authenticity/i }));
    expect(onCheckScore).toHaveBeenCalledOnce();
  });

  it('shows score result when available', () => {
    render(
      <PlatformTab
        {...defaultProps}
        scoreResult={{
          overall_score: 78,
          dimensions: [
            { name: 'Vocabulary', score: 80, feedback: 'Good match' },
            { name: 'Tone', score: 45, feedback: 'Needs work' },
          ],
        }}
      />
    );
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    expect(screen.getByText('Tone')).toBeInTheDocument();
  });

  it('shows loading state when scoring', () => {
    render(<PlatformTab {...defaultProps} isScoring={true} />);
    const button = screen.getByRole('button', { name: /check authenticity/i });
    expect(button).toBeDisabled();
  });
});
