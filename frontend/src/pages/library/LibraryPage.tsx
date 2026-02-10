import {
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, FileText, Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useClones } from '@/hooks/use-clones';
import { useContentList } from '@/hooks/use-content';

import { columns, type ContentRow } from './columns';

export function LibraryPage() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);

  const sortParam = sorting[0]?.id;
  const orderParam = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined;

  const { data: contentData, isLoading: contentLoading } = useContentList({
    sort: sortParam,
    order: orderParam,
  });
  const { data: cloneData, isLoading: clonesLoading } = useClones();

  const isLoading = contentLoading || clonesLoading;

  const cloneMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const clone of cloneData?.items ?? []) {
      map.set(clone.id, clone.name);
    }
    return map;
  }, [cloneData]);

  const rows: ContentRow[] = useMemo(
    () =>
      (contentData?.items ?? []).map((item) => ({
        ...item,
        clone_name: cloneMap.get(item.clone_id) ?? 'Unknown',
      })),
    [contentData, cloneMap]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="library-loading">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-72" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Content Library</h1>
        <EmptyState
          icon={FileText}
          heading="No content yet"
          description="Generate your first piece of content to see it here."
        >
          <Button asChild>
            <Link to="/create">
              <Plus />
              Create Content
            </Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground mt-2">{contentData?.total ?? 0} content items</p>
        </div>
        <Button asChild>
          <Link to="/create">
            <Plus />
            Create Content
          </Link>
        </Button>
      </div>

      <div ref={tableContainerRef} className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="size-3" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {(virtualizer.getVirtualItems().length > 0
              ? virtualizer.getVirtualItems().map((v) => tableRows[v.index])
              : tableRows
            ).map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => navigate(`/create/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
