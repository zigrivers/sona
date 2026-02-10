import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useKeyboardShortcut } from './use-keyboard-shortcut';

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }));
}

describe('useKeyboardShortcut', () => {
  it('fires callback on matching shortcut', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcut('s', { meta: true }, cb));

    fireKey('s', { metaKey: true });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('does not fire without required modifier', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcut('s', { meta: true }, cb));

    fireKey('s');
    expect(cb).not.toHaveBeenCalled();
  });

  it('supports shift modifier', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcut('Enter', { meta: true, shift: true }, cb));

    // Without shift — should NOT fire
    fireKey('Enter', { metaKey: true });
    expect(cb).not.toHaveBeenCalled();

    // With shift — should fire
    fireKey('Enter', { metaKey: true, shiftKey: true });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('does not fire when enabled=false', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcut('s', { meta: true }, cb, { enabled: false }));

    fireKey('s', { metaKey: true });
    expect(cb).not.toHaveBeenCalled();
  });

  it('cleans up listener on unmount', () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', { meta: true }, cb));

    unmount();
    fireKey('s', { metaKey: true });
    expect(cb).not.toHaveBeenCalled();
  });

  it('supports ctrlKey as alternative to metaKey', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcut('s', { meta: true }, cb));

    fireKey('s', { ctrlKey: true });
    expect(cb).toHaveBeenCalledOnce();
  });
});
