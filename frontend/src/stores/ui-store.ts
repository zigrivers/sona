import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
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
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
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
