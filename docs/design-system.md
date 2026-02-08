# Design System

Sona's design system: clean and minimal (Linear + Notion inspired), indigo palette, light + dark mode, desktop-first.

## Quick Reference

| Property | Value |
|----------|-------|
| Primary color | Indigo (OKLCH 0.465 0.195 275) |
| Font | Inter Variable |
| Border radius | 0.5rem (8px) |
| Style | shadcn/ui new-york |
| Base | Slate neutrals |
| Dark mode | Class-based (`.dark` on `<html>`) |

## Color Palette

### Semantic Colors

| Token | Usage |
|-------|-------|
| `primary` | Brand color, CTAs, active states |
| `secondary` | Supporting surfaces, secondary buttons |
| `muted` | Subdued backgrounds, disabled states |
| `accent` | Hover/active highlights |
| `destructive` | Delete, error actions |
| `success` | Positive feedback, confidence scores |
| `warning` | Caution states |
| `info` | Informational messages |

### Surface Colors

| Token | Usage |
|-------|-------|
| `background` | Page background |
| `foreground` | Primary text |
| `card` / `card-foreground` | Card surfaces |
| `popover` / `popover-foreground` | Dropdown/dialog surfaces |
| `muted` / `muted-foreground` | Secondary text, captions |

### Usage

```tsx
// Use semantic color classes — never raw hex/oklch values
<div className="bg-primary text-primary-foreground" />
<p className="text-muted-foreground" />
<div className="border-border" />
```

## Typography

Font: **Inter Variable** (self-hosted via `@fontsource-variable/inter`).

| Element | Classes |
|---------|---------|
| Page title | `text-4xl font-bold tracking-tight` |
| Section title | `text-2xl font-semibold tracking-tight` |
| Card header | `text-xl font-semibold` |
| Body | `text-base` (default) |
| Caption | `text-sm text-muted-foreground` |
| Code | `font-mono text-sm` |

## Spacing

Use Tailwind's spacing scale consistently:

| Context | Value |
|---------|-------|
| Page padding | `px-6 py-12` |
| Section gap | `space-y-12` |
| Card padding | Default from Card component |
| Element gap | `gap-2` (8px), `gap-3` (12px), `gap-4` (16px) |

## Components

All components live in `frontend/src/components/ui/` and are installed via shadcn/ui CLI.

### Installed Components

**Layout & display:** Button, Card, Badge, Separator, ScrollArea, Skeleton, Tooltip
**Forms:** Input, Textarea, Label, Select, Slider, Switch, Checkbox
**Overlays & navigation:** Dialog, DropdownMenu, Popover, Tabs, Sonner (toast)
**Data:** Table, Avatar, Progress

### Adding New Components

```bash
cd frontend && pnpm dlx shadcn@latest add <component-name>
```

Components are fully customizable after installation — edit the files in `src/components/ui/`.

### Component Patterns

```tsx
// Buttons — use semantic variants
<Button>Primary action</Button>
<Button variant="outline">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Subtle</Button>

// Cards
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>

// Semantic badges for status
<Badge>Default</Badge>
<Badge className="bg-success text-success-foreground">Active</Badge>
<Badge className="bg-warning text-warning-foreground">Pending</Badge>
```

## Icons

Using `lucide-react`. Size conventions:

| Context | Size |
|---------|------|
| Inline with text | `size-4` (16px) |
| In buttons | `size-4` (16px) — auto-sized by Button |
| Standalone | `size-6` (24px) |
| Empty state | `size-8` (32px) |

## Dark Mode

Theme is managed via Zustand store (`src/stores/ui-store.ts`):

```tsx
import { useUIStore } from '@/stores/ui-store';

// Read theme
const theme = useUIStore((s) => s.theme);

// Set theme
const setTheme = useUIStore((s) => s.setTheme);
setTheme('dark'); // 'light' | 'dark' | 'system'
```

- State persisted to `localStorage` key `sona-ui`
- Flash prevention script in `index.html` reads the same key
- `.dark` class toggled on `<html>` element

## Toast Notifications

```tsx
import { toast } from 'sonner';

toast.success('Saved!');
toast.error('Something went wrong');
toast.info('FYI...');
toast.warning('Watch out');
```

`<Toaster />` is rendered in `App.tsx` — no need to add it per-page.

## Chart Colors

Five themed colors for Recharts:

| Token | Color |
|-------|-------|
| `chart-1` | Indigo (primary) |
| `chart-2` | Green |
| `chart-3` | Amber |
| `chart-4` | Blue |
| `chart-5` | Red |

Access via CSS variables: `var(--color-chart-1)` through `var(--color-chart-5)`.

## Design System Showcase

Visit `/design-system` in development to see all components, colors, and typography in action.

## Do's and Don'ts

**Do:**
- Use palette color classes (`bg-primary`, `text-muted-foreground`)
- Use the spacing scale (`gap-2`, `p-4`, `space-y-6`)
- Use shadcn/ui components for all standard UI patterns
- Use `cn()` from `@/lib/utils` to merge class names
- Test dark mode for every new component

**Don't:**
- Use raw color values (`bg-indigo-600`, `#4f46e5`)
- Use arbitrary spacing values (`p-[13px]`)
- Create custom components when a shadcn/ui primitive exists
- Forget to handle both light and dark mode
- Import colors directly — always use the CSS variable system
