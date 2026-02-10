import {
  flexRender,
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, FileText, Import, Plus, SearchX } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { BulkActions } from '@/components/content/BulkActions';
import { ImportDialog } from '@/components/content/ImportDialog';
import { LibraryFilters, type LibraryFiltersState } from '@/components/content/LibraryFilters';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClones } from '@/hooks/use-clones';
import { useContentList } from '@/hooks/use-content';

import { columns, type ContentRow, selectColumn } from './columns';

const STATUS_TABS = ['all', 'draft', 'review', 'approved', 'published', 'archived'] as const;

export function LibraryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showImport, setShowImport] = useState(false);

  // Read filters from URL params
  const statusTab = searchParams.get('status') ?? 'all';
  const filters: LibraryFiltersState = {
    clone_id: searchParams.get('clone_id') ?? undefined,
    platform: searchParams.get('platform') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  };

  const hasActiveFilters = !!(
    filters.clone_id ||
    filters.platform ||
    filters.search ||
    statusTab !== 'all'
  );

  function handleStatusTabChange(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === 'all') {
        next.delete('status');
      } else {
        next.set('status', value);
      }
      return next;
    });
    setRowSelection({});
  }

  function handleFiltersChange(newFilters: LibraryFiltersState) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      // Update each filter param
      for (const key of ['clone_id', 'platform', 'search'] as const) {
        if (newFilters[key]) {
          next.set(key, newFilters[key]);
        } else {
          next.delete(key);
        }
      }
      return next;
    });
    setRowSelection({});
  }

  function handleClearAllFilters() {
    setSearchParams({});
    setRowSelection({});
  }

  const sortParam = sorting[0]?.id;
  const orderParam = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined;

  const { data: contentData, isLoading: contentLoading } = useContentList({
    sort: sortParam,
    order: orderParam,
    clone_id: filters.clone_id,
    platform: filters.platform,
    status: statusTab !== 'all' ? statusTab : undefined,
    search: filters.search,
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

  const allColumns = useMemo(() => [selectColumn, ...columns], []);

  const table = useReactTable({
    data: rows,
    columns: allColumns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  const handleBulkComplete = useCallback(() => {
    setRowSelection({});
  }, []);

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

  // True empty: no content at all (no filters active)
  if (rows.length === 0 && !hasActiveFilters) {
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Import />
            Import
          </Button>
          <Button asChild>
            <Link to="/create">
              <Plus />
              Create Content
            </Link>
          </Button>
        </div>
      </div>

      <ImportDialog open={showImport} onOpenChange={setShowImport} />

      <Tabs value={statusTab} onValueChange={handleStatusTabChange}>
        <TabsList variant="line">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <LibraryFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {rows.length === 0 && hasActiveFilters ? (
        <EmptyState
          icon={SearchX}
          heading="No results match filters"
          description="Try adjusting your filters or search terms."
        >
          <Button variant="outline" onClick={handleClearAllFilters}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
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
                  data-state={row.getIsSelected() ? 'selected' : undefined}
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
      )}

      <BulkActions selectedIds={selectedIds} onComplete={handleBulkComplete} />
    </div>
  );
}
