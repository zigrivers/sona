import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders Sona branding in sidebar', () => {
    render(<App />);
    expect(screen.getByText('Sona')).toBeInTheDocument();
  });

  it('redirects root to /clones', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /clones/i })).toBeInTheDocument();
  });
});
