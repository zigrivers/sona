import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  hideDemoClones: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setHideDemoClones: (hide: boolean) => void;
}

function applyTheme(theme: Theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', isDark);
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      hideDemoClones: false,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setHideDemoClones: (hide) => set({ hideDemoClones: hide }),
    }),
    {
      name: 'sona-ui',
      onRehydrateStorage: () => {
        return (state: UIState | undefined) => {
          if (state) {
            applyTheme(state.theme);
          }
        };
      },
    }
  )
);
