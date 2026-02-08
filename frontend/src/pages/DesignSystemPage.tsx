import {
  ChevronDown,
  Copy,
  FileText,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type Theme, useUIStore } from '@/stores/ui-store';

const PALETTE_COLORS = [
  { name: 'background', className: 'bg-background' },
  { name: 'foreground', className: 'bg-foreground' },
  { name: 'card', className: 'bg-card' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'secondary', className: 'bg-secondary' },
  { name: 'muted', className: 'bg-muted' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'destructive', className: 'bg-destructive' },
  { name: 'success', className: 'bg-success' },
  { name: 'warning', className: 'bg-warning' },
  { name: 'info', className: 'bg-info' },
  { name: 'border', className: 'bg-border' },
  { name: 'ring', className: 'bg-ring' },
];

const CHART_COLORS = [
  { name: 'chart-1', className: 'bg-chart-1' },
  { name: 'chart-2', className: 'bg-chart-2' },
  { name: 'chart-3', className: 'bg-chart-3' },
  { name: 'chart-4', className: 'bg-chart-4' },
  { name: 'chart-5', className: 'bg-chart-5' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <Separator />
      {children}
    </section>
  );
}

function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="size-4" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="size-4" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="size-4" />, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            theme === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function DesignSystemPage() {
  const [sliderValue, setSliderValue] = useState([50]);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Design System</h1>
            <p className="text-muted-foreground mt-2">Sona component library and design tokens</p>
          </div>
          <ThemeToggle />
        </div>

        {/* 1. Color Palette */}
        <Section title="Color Palette">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-7">
            {PALETTE_COLORS.map((color) => (
              <div key={color.name} className="space-y-1.5">
                <div className={`${color.className} h-16 rounded-lg border`} />
                <p className="text-muted-foreground text-xs">{color.name}</p>
              </div>
            ))}
          </div>
          <h3 className="mt-6 text-lg font-medium">Chart Colors</h3>
          <div className="flex gap-3">
            {CHART_COLORS.map((color) => (
              <div key={color.name} className="space-y-1.5">
                <div className={`${color.className} h-16 w-20 rounded-lg border`} />
                <p className="text-muted-foreground text-xs">{color.name}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 2. Typography */}
        <Section title="Typography">
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">text-4xl / font-bold</p>
              <h1 className="text-4xl font-bold tracking-tight">Heading 1 — Page title</h1>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">text-3xl / font-semibold</p>
              <h2 className="text-3xl font-semibold tracking-tight">Heading 2 — Section title</h2>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">text-2xl / font-semibold</p>
              <h3 className="text-2xl font-semibold tracking-tight">Heading 3 — Subsection</h3>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">text-xl / font-semibold</p>
              <h4 className="text-xl font-semibold">Heading 4 — Card header</h4>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">text-base (default)</p>
              <p>
                Body text — The quick brown fox jumps over the lazy dog. Sona helps you capture your
                unique writing voice.
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">text-sm / text-muted-foreground</p>
              <p className="text-muted-foreground text-sm">
                Caption text — Secondary information and metadata
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">font-mono / text-sm</p>
              <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
                const voice = await cloneVoice(samples);
              </code>
            </div>
          </div>
        </Section>

        {/* 3. Buttons */}
        <Section title="Buttons">
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground mb-3 text-sm">Variants</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-3 text-sm">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Plus />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-3 text-sm">With icons</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>
                  <Mail />
                  Email
                </Button>
                <Button variant="outline">
                  <Search />
                  Search
                </Button>
                <Button variant="destructive">
                  <Trash2 />
                  Delete
                </Button>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-3 text-sm">States</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Disabled</Button>
                <Button
                  onClick={() =>
                    toast.success('Action completed', {
                      description: 'This is a toast notification.',
                    })
                  }
                >
                  Show Toast
                </Button>
              </div>
            </div>
          </div>
        </Section>

        {/* 4. Form Controls */}
        <Section title="Form Controls">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-demo">Text Input</Label>
                <Input id="input-demo" placeholder="Enter text..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textarea-demo">Textarea</Label>
                <Textarea id="textarea-demo" placeholder="Write something..." />
              </div>
              <div className="space-y-2">
                <Label>Select</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt4">GPT-4</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Slider ({sliderValue[0]}%)</Label>
                <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="switch-demo"
                  checked={switchChecked}
                  onCheckedChange={setSwitchChecked}
                />
                <Label htmlFor="switch-demo">Dark mode ({switchChecked ? 'on' : 'off'})</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="checkbox-demo"
                  checked={checkboxChecked}
                  onCheckedChange={(v) => setCheckboxChecked(v === true)}
                />
                <Label htmlFor="checkbox-demo">I agree to the terms</Label>
              </div>
            </div>
          </div>
        </Section>

        {/* 5. Cards */}
        <Section title="Cards">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>A basic card with content</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Cards contain related content and actions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>With Footer</CardTitle>
                <CardDescription>Card with action buttons</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Use footers for primary actions.</p>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Hover to see elevation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Use hover effects for clickable cards.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* 6. Badges */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-success text-success-foreground">Success</Badge>
            <Badge className="bg-warning text-warning-foreground">Warning</Badge>
            <Badge className="bg-info text-info-foreground">Info</Badge>
          </div>
        </Section>

        {/* 7. Data Table */}
        <Section title="Data Table">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voice Clone</TableHead>
                  <TableHead>Samples</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Professional Tone</TableCell>
                  <TableCell>24</TableCell>
                  <TableCell>
                    <Progress value={92} className="w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-success text-success-foreground">Active</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Casual Blog</TableCell>
                  <TableCell>12</TableCell>
                  <TableCell>
                    <Progress value={67} className="w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">Training</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Technical Writer</TableCell>
                  <TableCell>8</TableCell>
                  <TableCell>
                    <Progress value={34} className="w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">Draft</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </Section>

        {/* 8. Avatars */}
        <Section title="Avatars">
          <div className="flex items-center gap-4">
            <Avatar size="sm">
              <AvatarFallback>KA</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>KA</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
          </div>
        </Section>

        {/* 9. Dialog & Popover */}
        <Section title="Dialog & Popover">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm action</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this voice clone? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Quick Settings</h4>
                  <p className="text-muted-foreground text-sm">
                    Popover content for contextual information.
                  </p>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Menu
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Copy />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Section>

        {/* 10. Tabs */}
        <Section title="Tabs">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="samples">Samples</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">
                    Overview tab content. Use tabs to organize related content into sections.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="samples" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">Writing samples tab content.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">Settings tab content.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Section>

        {/* 11. Loading States */}
        <Section title="Loading States">
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground mb-3 text-sm">Skeleton loading</p>
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-3 text-sm">Card skeleton</p>
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-64" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            </div>
            <div>
              <p className="text-muted-foreground mb-3 text-sm">Progress bar</p>
              <Progress value={65} />
            </div>
          </div>
        </Section>

        {/* 12. Empty State */}
        <Section title="Empty State">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-muted rounded-full p-4">
                <FileText className="text-muted-foreground size-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No voice clones yet</h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                Upload writing samples to create your first voice clone and start generating content
                in your unique style.
              </p>
              <Button className="mt-6">
                <Plus />
                Create Voice Clone
              </Button>
            </CardContent>
          </Card>
        </Section>
      </div>
    </TooltipProvider>
  );
}
