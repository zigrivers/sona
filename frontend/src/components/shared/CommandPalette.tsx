import {
  FileTextIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  PenLineIcon,
  SettingsIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useClones } from '@/hooks/use-clones';
import { useUIStore } from '@/stores/ui-store';

const pages = [
  { label: 'Clones', href: '/clones', icon: UsersIcon },
  { label: 'Create Clone', href: '/clones/new', icon: UserPlusIcon },
  { label: 'Content Generator', href: '/create', icon: PenLineIcon },
  { label: 'Content Library', href: '/library', icon: LibraryIcon },
  { label: 'Providers', href: '/settings/providers', icon: SettingsIcon },
  { label: 'Methodology', href: '/settings/methodology', icon: FileTextIcon },
  { label: 'Presets', href: '/settings/presets', icon: LayoutDashboardIcon },
  { label: 'Data & Privacy', href: '/settings/data', icon: SettingsIcon },
];

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const navigate = useNavigate();
  const { data } = useClones();
  const clones = data?.items ?? [];

  function handleSelect(href: string) {
    navigate(href);
    setOpen(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages and clones..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem key={page.href} onSelect={() => handleSelect(page.href)}>
                <Icon className="mr-2 size-4" />
                {page.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
        {clones.length > 0 && (
          <CommandGroup heading="Clones">
            {clones.map((clone) => (
              <CommandItem key={clone.id} onSelect={() => handleSelect(`/clones/${clone.id}`)}>
                <UsersIcon className="mr-2 size-4" />
                {clone.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
