import { AlertTriangle, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClones } from '@/hooks/use-clones';
import { cn } from '@/lib/utils';

const CONFIDENCE_THRESHOLD = 60;

interface VoiceSelectorProps {
  value: string | null;
  onChange: (cloneId: string) => void;
}

export function VoiceSelector({ value, onChange }: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data } = useClones();

  const clones = useMemo(() => (data?.items ?? []).filter((c) => !c.is_hidden), [data]);

  const filtered = useMemo(
    () =>
      search ? clones.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : clones,
    [clones, search]
  );

  const selected = clones.find((c) => c.id === value);

  return (
    <div className="space-y-2">
      <Label>Voice Clone</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="button"
            aria-label={selected ? selected.name : 'Select a voice'}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.name}
                <Badge
                  variant={
                    selected.confidence_score < CONFIDENCE_THRESHOLD ? 'destructive' : 'default'
                  }
                >
                  {selected.confidence_score}%
                </Badge>
                {selected.confidence_score < CONFIDENCE_THRESHOLD && (
                  <AlertTriangle
                    className="text-destructive size-4"
                    data-testid="confidence-warning"
                  />
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">Select a voice</span>
            )}
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2">
            <Input
              placeholder="Search clones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ScrollArea className="max-h-60">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground px-3 py-2 text-sm">No clones found.</p>
            ) : (
              filtered.map((clone) => (
                <button
                  key={clone.id}
                  type="button"
                  className={cn(
                    'hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-sm',
                    clone.id === value && 'bg-accent'
                  )}
                  onClick={() => {
                    onChange(clone.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <span>{clone.name}</span>
                  <Badge
                    variant={
                      clone.confidence_score < CONFIDENCE_THRESHOLD ? 'destructive' : 'secondary'
                    }
                  >
                    {clone.confidence_score}%
                  </Badge>
                </button>
              ))
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
