import { Outlet } from 'react-router-dom';

import { CommandPalette } from '@/components/shared/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  useKeyboardShortcuts();

  return (
    <div className="bg-background flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto px-6 py-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
