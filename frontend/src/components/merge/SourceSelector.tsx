import { ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClones } from '@/hooks/use-clones';
import { useClonesWithDna } from '@/hooks/use-merge';
import { cn } from '@/lib/utils';

const MAX_SOURCES = 5;

interface SourceSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function SourceSelector({ selectedIds, onChange }: SourceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data } = useClones();

  const clones = useMemo(() => (data?.items ?? []).filter((c) => !c.is_hidden), [data]);
  const cloneIds = useMemo(() => clones.map((c) => c.id), [clones]);
  const dnaResults = useClonesWithDna(cloneIds);

  const dnaMap = useMemo(() => {
    const map = new Map<string, boolean>();
    cloneIds.forEach((id, i) => {
      const result = dnaResults[i];
      map.set(id, result?.data !== null && result?.data !== undefined);
    });
    return map;
  }, [cloneIds, dnaResults]);

  const filtered = useMemo(
    () =>
      search ? clones.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : clones,
    [clones, search]
  );

  function toggleClone(cloneId: string) {
    if (selectedIds.includes(cloneId)) {
      onChange(selectedIds.filter((id) => id !== cloneId));
    } else if (selectedIds.length < MAX_SOURCES) {
      onChange([...selectedIds, cloneId]);
    }
  }

  const triggerLabel =
    selectedIds.length === 0
      ? 'Select source clones'
      : `${selectedIds.length} clone${selectedIds.length === 1 ? '' : 's'} selected`;

  return (
    <div className="space-y-2">
      <Label>Source Clones (2–5)</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="button"
            aria-label={triggerLabel}
            className="w-full justify-between font-normal"
          >
            <span className={cn(selectedIds.length === 0 && 'text-muted-foreground')}>
              {triggerLabel}
            </span>
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
              filtered.map((clone) => {
                const hasDna = dnaMap.get(clone.id) ?? false;
                const isSelected = selectedIds.includes(clone.id);
                const isDisabled = !hasDna;

                return (
                  <div
                    key={clone.id}
                    data-slot="clone-row"
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-sm',
                      isDisabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-accent cursor-pointer',
                      isSelected && hasDna && 'bg-accent'
                    )}
                    onClick={() => !isDisabled && toggleClone(clone.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => !isDisabled && toggleClone(clone.id)}
                      aria-label={`Select ${clone.name}`}
                    />
                    <span className="flex-1">{clone.name}</span>
                    {isDisabled ? (
                      <Badge variant="secondary">No DNA</Badge>
                    ) : (
                      <Badge variant="default">{clone.confidence_score}%</Badge>
                    )}
                  </div>
                );
              })
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
