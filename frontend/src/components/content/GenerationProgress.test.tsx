import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GenerationProgress } from './GenerationProgress';

describe('GenerationProgress', () => {
  it('renders heading', () => {
    render(<GenerationProgress platforms={['linkedin']} />);
    expect(screen.getByText(/generating content/i)).toBeInTheDocument();
  });

  it('renders platform names', () => {
    render(<GenerationProgress platforms={['linkedin', 'twitter']} />);
    expect(screen.getByText(/linkedin/i)).toBeInTheDocument();
    expect(screen.getByText(/twitter/i)).toBeInTheDocument();
  });

  it('renders a spinner per platform', () => {
    const { container } = render(
      <GenerationProgress platforms={['linkedin', 'twitter', 'email']} />
    );
    // Loader2 icons have the animate-spin class
    const spinners = container.querySelectorAll('.animate-spin');
    expect(spinners.length).toBe(3);
  });
});
