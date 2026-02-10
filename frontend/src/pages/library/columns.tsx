import type { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { ContentResponse } from '@/types/api';
import { PLATFORMS } from '@/types/platforms';

import { ScoreBadge } from './ScoreBadge';
import { StatusBadge } from './StatusBadge';

export interface ContentRow extends ContentResponse {
  clone_name: string;
}

export const selectColumn: ColumnDef<ContentRow> = {
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
      }
      onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(checked) => row.toggleSelected(!!checked)}
      aria-label="Select row"
      onClick={(e) => e.stopPropagation()}
    />
  ),
  enableSorting: false,
};

export const columns: ColumnDef<ContentRow>[] = [
  {
    accessorKey: 'content_current',
    header: 'Content',
    enableSorting: false,
    cell: ({ row, getValue }) => {
      const text = getValue<string>();
      const isImported = row.original.generation_properties?.source === 'import';
      return (
        <span className="text-sm">
          {isImported && (
            <Badge variant="outline" className="mr-2">
              Imported
            </Badge>
          )}
          {text.length > 100 ? `${text.slice(0, 100)}…` : text}
        </span>
      );
    },
  },
  {
    accessorKey: 'clone_name',
    header: 'Clone',
    enableSorting: false,
  },
  {
    accessorKey: 'platform',
    header: 'Platform',
    cell: ({ getValue }) => {
      const key = getValue<string>();
      return PLATFORMS[key as keyof typeof PLATFORMS]?.label ?? key;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
  },
  {
    accessorKey: 'authenticity_score',
    header: 'Score',
    cell: ({ getValue }) => <ScoreBadge score={getValue<number | null>()} />,
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ getValue }) => {
      const date = new Date(getValue<string>());
      return date.toLocaleDateString();
    },
  },
];
