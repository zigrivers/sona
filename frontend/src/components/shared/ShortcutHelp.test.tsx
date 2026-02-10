import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useUIStore } from '@/stores/ui-store';
import { renderWithProviders } from '@/test/render';

import { ShortcutHelp } from './ShortcutHelp';

describe('ShortcutHelp', () => {
  beforeEach(() => {
    useUIStore.setState({ shortcutHelpOpen: false });
  });

  it('renders when shortcutHelpOpen is true', () => {
    useUIStore.setState({ shortcutHelpOpen: true });
    renderWithProviders(<ShortcutHelp />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('does not render dialog content when closed', () => {
    renderWithProviders(<ShortcutHelp />);

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('lists all shortcut groups', () => {
    useUIStore.setState({ shortcutHelpOpen: true });
    renderWithProviders(<ShortcutHelp />);

    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('Content Generator')).toBeInTheDocument();
    expect(screen.getByText('Content Library')).toBeInTheDocument();
  });

  it('closes when Escape is pressed', async () => {
    useUIStore.setState({ shortcutHelpOpen: true });
    const user = userEvent.setup();
    renderWithProviders(<ShortcutHelp />);

    await user.keyboard('{Escape}');

    expect(useUIStore.getState().shortcutHelpOpen).toBe(false);
  });
});
