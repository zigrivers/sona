import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/test/render';

import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('should render all navigation links', () => {
    renderWithRouter(<Sidebar />, { initialEntries: ['/clones'] });

    expect(screen.getByRole('link', { name: /clones/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /content generator/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /content library/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('should highlight the active route', () => {
    renderWithRouter(<Sidebar />, { initialEntries: ['/clones'] });

    const clonesLink = screen.getByRole('link', { name: /clones/i });
    expect(clonesLink).toHaveAttribute('aria-current', 'page');

    const libraryLink = screen.getByRole('link', { name: /content library/i });
    expect(libraryLink).not.toHaveAttribute('aria-current');
  });

  it('should show settings sub-navigation when Settings is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Sidebar />, { initialEntries: ['/clones'] });

    // Sub-links should not be visible initially
    expect(screen.queryByRole('link', { name: /providers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /methodology/i })).not.toBeInTheDocument();

    // Click Settings to expand
    await user.click(screen.getByRole('button', { name: /settings/i }));

    // Sub-links should now be visible
    expect(screen.getByRole('link', { name: /providers/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /methodology/i })).toBeInTheDocument();
  });

  it('should auto-expand settings when on a settings route', () => {
    renderWithRouter(<Sidebar />, { initialEntries: ['/settings/providers'] });

    expect(screen.getByRole('link', { name: /providers/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /methodology/i })).toBeInTheDocument();
  });

  it('should highlight active settings sub-link', () => {
    renderWithRouter(<Sidebar />, { initialEntries: ['/settings/providers'] });

    const providersLink = screen.getByRole('link', { name: /providers/i });
    expect(providersLink).toHaveAttribute('aria-current', 'page');
  });
});
