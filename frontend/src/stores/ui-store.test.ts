import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useUIStore } from './ui-store';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({ theme: 'system' });
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
});
