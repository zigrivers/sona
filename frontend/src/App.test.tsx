import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders Sona branding in sidebar', () => {
    render(<App />);
    expect(screen.getByText('Sona')).toBeInTheDocument();
  });

  it('redirects root to /clones', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/welcome to sona/i)).toBeInTheDocument();
    });
  });
});
