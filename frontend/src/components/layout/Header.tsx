import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';

export function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="border-border flex h-14 items-center gap-4 border-b px-6">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="size-4" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </header>
  );
}
