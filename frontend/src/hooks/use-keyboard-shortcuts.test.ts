import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUIStore } from '@/stores/ui-store';

import { useKeyboardShortcuts } from './use-keyboard-shortcuts';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    useUIStore.setState({ commandPaletteOpen: false, shortcutHelpOpen: false });
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens command palette on Cmd+K', () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });

  it('navigates to /clones/new on Cmd+N', () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(mockNavigate).toHaveBeenCalledWith('/clones/new');
  });

  it('opens shortcut help on ? key', () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '?',
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(useUIStore.getState().shortcutHelpOpen).toBe(true);
  });

  it('does not open shortcut help when target is an input', () => {
    renderHook(() => useKeyboardShortcuts());

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      key: '?',
      bubbles: true,
    });
    input.dispatchEvent(event);

    expect(useUIStore.getState().shortcutHelpOpen).toBe(false);
    document.body.removeChild(input);
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts());
    unmount();

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });
});
