import { Search, X } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClones } from '@/hooks/use-clones';
import { type PlatformKey, PLATFORMS } from '@/types/platforms';

export interface LibraryFiltersState {
  clone_id?: string;
  platform?: string;
  search?: string;
}

interface LibraryFiltersProps {
  filters: LibraryFiltersState;
  onFiltersChange: (filters: LibraryFiltersState) => void;
}

const DEBOUNCE_MS = 300;

export const LibraryFilters = forwardRef<HTMLInputElement, LibraryFiltersProps>(
  function LibraryFilters({ filters, onFiltersChange }, ref) {
  const { data: cloneData } = useClones();
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync external filter changes into local search input
  useEffect(() => {
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined });
    }, DEBOUNCE_MS);
  }

  function handleCloneChange(value: string) {
    onFiltersChange({
      ...filters,
      clone_id: value === 'all' ? undefined : value,
    });
  }

  function handlePlatformToggle(platform: PlatformKey, checked: boolean) {
    if (checked) {
      onFiltersChange({ ...filters, platform });
    } else if (filters.platform === platform) {
      onFiltersChange({ ...filters, platform: undefined });
    }
  }

  const hasFilters = filters.clone_id || filters.platform || filters.search;

  function handleClearFilters() {
    setSearchInput('');
    clearTimeout(debounceRef.current);
    onFiltersChange({});
  }

  return (
    <div className="flex flex-wrap items-center gap-4" data-testid="library-filters">
      <Select value={filters.clone_id ?? 'all'} onValueChange={handleCloneChange}>
        <SelectTrigger className="w-48" aria-label="Filter by clone">
          <SelectValue placeholder="All Clones" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Clones</SelectItem>
          {(cloneData?.items ?? []).map((clone) => (
            <SelectItem key={clone.id} value={clone.id}>
              {clone.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-3">
        {(Object.entries(PLATFORMS) as [PlatformKey, (typeof PLATFORMS)[PlatformKey]][]).map(
          ([key, { label }]) => (
            <label key={key} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={filters.platform === key}
                onCheckedChange={(checked) => handlePlatformToggle(key, !!checked)}
                aria-label={label}
              />
              {label}
            </label>
          )
        )}
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          ref={ref}
          placeholder="Search content…"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-64 pl-9"
          aria-label="Search content"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="size-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
});
