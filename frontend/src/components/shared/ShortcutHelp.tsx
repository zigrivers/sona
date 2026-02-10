import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUIStore } from '@/stores/ui-store';

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);
const mod = isMac ? '⌘' : 'Ctrl';

const shortcutGroups = [
  {
    label: 'Global',
    shortcuts: [
      { keys: `${mod}K`, description: 'Open command palette' },
      { keys: `${mod}N`, description: 'New clone' },
      { keys: '?', description: 'Show keyboard shortcuts' },
    ],
  },
  {
    label: 'Content Generator',
    shortcuts: [
      { keys: `${mod}↵`, description: 'Generate content' },
      { keys: `${mod}⇧↵`, description: 'Generate variants' },
      { keys: `${mod}S`, description: 'Save to library' },
    ],
  },
  {
    label: 'Content Library',
    shortcuts: [
      { keys: `${mod}F`, description: 'Focus search' },
      { keys: `${mod}A`, description: 'Select all' },
    ],
  },
];

export function ShortcutHelp() {
  const open = useUIStore((s) => s.shortcutHelpOpen);
  const setOpen = useUIStore((s) => s.setShortcutHelpOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {shortcutGroups.map((group) => (
            <div key={group.label}>
              <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center justify-between py-1">
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-xs">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
