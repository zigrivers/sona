import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useUIStore } from '@/stores/ui-store';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;

      if (event.key === 'k') {
        event.preventDefault();
        useUIStore.getState().setCommandPaletteOpen(!useUIStore.getState().commandPaletteOpen);
      }

      if (event.key === 'n') {
        event.preventDefault();
        navigate('/clones/new');
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
