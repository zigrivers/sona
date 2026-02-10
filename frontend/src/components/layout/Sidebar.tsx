import { ChevronDown, ChevronRight, Library, PenLine, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

const navItems = [
  { label: 'Clones', href: '/clones', icon: Users },
  { label: 'Content Generator', href: '/create', icon: PenLine },
  { label: 'Content Library', href: '/library', icon: Library },
];

const settingsItems = [
  { label: 'Providers', href: '/settings/providers' },
  { label: 'Methodology', href: '/settings/methodology' },
  { label: 'Presets', href: '/settings/presets' },
  { label: 'Data & Privacy', href: '/settings/data' },
];

export function Sidebar() {
  const location = useLocation();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const isSettingsRoute = location.pathname.startsWith('/settings');
  const [settingsOpen, setSettingsOpen] = useState(isSettingsRoute);

  if (sidebarCollapsed) {
    return null;
  }

  return (
    <aside className="border-sidebar-border bg-sidebar flex w-64 shrink-0 flex-col border-r">
      <div className="p-6">
        <span className="text-sidebar-foreground text-xl font-bold">Sona</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}

        <div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isSettingsRoute
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Settings className="size-4" />
            Settings
            {settingsOpen ? (
              <ChevronDown className="ml-auto size-4" />
            ) : (
              <ChevronRight className="ml-auto size-4" />
            )}
          </button>
          {settingsOpen && (
            <div className="mt-1 ml-4 space-y-1">
              {settingsItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
