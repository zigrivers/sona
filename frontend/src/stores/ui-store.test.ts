import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useUIStore } from './ui-store';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      theme: 'system',
      sidebarCollapsed: false,
      hideDemoClones: false,
      showInputPanel: false,
      commandPaletteOpen: false,
      shortcutHelpOpen: false,
    });
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('defaults to system theme', () => {
    expect(useUIStore.getState().theme).toBe('system');
  });

  it('sets theme to dark and adds dark class', () => {
    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('sets theme to light and removes dark class', () => {
    document.documentElement.classList.add('dark');
    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles between light and dark', () => {
    useUIStore.getState().setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    useUIStore.getState().setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('defaults sidebar to expanded', () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('toggles sidebar collapsed state', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('defaults showInputPanel to false', () => {
    expect(useUIStore.getState().showInputPanel).toBe(false);
  });

  it('sets showInputPanel via setShowInputPanel', () => {
    useUIStore.getState().setShowInputPanel(true);
    expect(useUIStore.getState().showInputPanel).toBe(true);

    useUIStore.getState().setShowInputPanel(false);
    expect(useUIStore.getState().showInputPanel).toBe(false);
  });

  it('defaults command palette to closed', () => {
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('setCommandPaletteOpen toggles the state', () => {
    useUIStore.getState().setCommandPaletteOpen(true);
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);

    useUIStore.getState().setCommandPaletteOpen(false);
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('defaults shortcutHelpOpen to false', () => {
    expect(useUIStore.getState().shortcutHelpOpen).toBe(false);
  });

  it('setShortcutHelpOpen toggles the state', () => {
    useUIStore.getState().setShortcutHelpOpen(true);
    expect(useUIStore.getState().shortcutHelpOpen).toBe(true);

    useUIStore.getState().setShortcutHelpOpen(false);
    expect(useUIStore.getState().shortcutHelpOpen).toBe(false);
  });
});
