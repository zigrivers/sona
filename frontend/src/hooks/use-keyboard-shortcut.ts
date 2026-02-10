import { useEffect } from 'react';

interface ShortcutOptions {
  /** Whether the shortcut is currently active. Default: true */
  enabled?: boolean;
}

/**
 * Register a keyboard shortcut that fires a callback.
 *
 * @param key - The key to listen for (e.g. 'Enter', 's', 'f', 'a')
 * @param modifiers - Required modifier keys: meta (Cmd/Ctrl), shift, alt
 * @param callback - Function to call when the shortcut fires
 * @param options - Additional options (enabled flag)
 */
export function useKeyboardShortcut(
  key: string,
  modifiers: { meta?: boolean; shift?: boolean; alt?: boolean },
  callback: () => void,
  options: ShortcutOptions = {}
) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const metaMatch = modifiers.meta ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey;
      const shiftMatch = modifiers.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = modifiers.alt ? e.altKey : !e.altKey;

      if (e.key.toLowerCase() === key.toLowerCase() && metaMatch && shiftMatch && altMatch) {
        e.preventDefault();
        callback();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, modifiers.meta, modifiers.shift, modifiers.alt, callback, enabled]);
}
