import type { ColumnDef } from '@tanstack/react-table';

import type { ContentResponse } from '@/types/api';
import { PLATFORMS } from '@/types/platforms';

import { ScoreBadge } from './ScoreBadge';
import { StatusBadge } from './StatusBadge';

export interface ContentRow extends ContentResponse {
  clone_name: string;
}

export const columns: ColumnDef<ContentRow>[] = [
  {
    accessorKey: 'content_current',
    header: 'Content',
    enableSorting: false,
    cell: ({ getValue }) => {
      const text = getValue<string>();
      return <span className="text-sm">{text.length > 100 ? `${text.slice(0, 100)}…` : text}</span>;
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
