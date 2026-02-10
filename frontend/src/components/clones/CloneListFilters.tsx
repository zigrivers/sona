import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export type CloneTypeFilter = 'all' | 'original' | 'merged' | 'demo';

interface CloneListFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: CloneTypeFilter;
  onTypeFilterChange: (type: CloneTypeFilter) => void;
  hideDemos: boolean;
  onHideDemosChange: (hide: boolean) => void;
}

export function CloneListFilters({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  hideDemos,
  onHideDemosChange,
}: CloneListFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search clones..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(val) => onTypeFilterChange(val as CloneTypeFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="original">Original</SelectItem>
            <SelectItem value="merged">Merged</SelectItem>
            <SelectItem value="demo">Demo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="hide-demos"
          checked={hideDemos}
          onCheckedChange={onHideDemosChange}
        />
        <Label htmlFor="hide-demos">Hide demo clones</Label>
      </div>
    </div>
  );
}
