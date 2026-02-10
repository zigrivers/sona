import { Mic, Plus, SearchX, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { CloneCard } from '@/components/clones/CloneCard';
import { CloneListFilters, type CloneTypeFilter } from '@/components/clones/CloneListFilters';
import { DeletedClones } from '@/components/clones/DeletedClones';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClones } from '@/hooks/use-clones';
import { useHasProvider } from '@/hooks/use-providers';
import { useUIStore } from '@/stores/ui-store';

export function ClonesPage() {
  const { hasProvider, isLoading: providersLoading } = useHasProvider();
  const { data: cloneData, isLoading: clonesLoading } = useClones();
  const [showDemos, setShowDemos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CloneTypeFilter>('all');
  const hideDemoClones = useUIStore((s) => s.hideDemoClones);
  const setHideDemoClones = useUIStore((s) => s.setHideDemoClones);

  const isLoading = providersLoading || clonesLoading;

  const filteredClones = useMemo(() => {
    if (!cloneData?.items) return [];

    return cloneData.items
      .filter((c) => {
        if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (typeFilter !== 'all' && c.type !== typeFilter) return false;
        if (hideDemoClones && c.is_demo) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [cloneData?.items, searchQuery, typeFilter, hideDemoClones]);

  const hasClones = (cloneData?.items.length ?? 0) > 0;

  function clearFilters() {
    setSearchQuery('');
    setTypeFilter('all');
  }

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="clones-loading">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-72" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasProvider && !showDemos) {
    return (
      <div className="space-y-8">
        <EmptyState
          icon={Mic}
          heading="Welcome to Sona"
          description="Clone any voice with AI. Start by connecting an AI provider, then explore demo voices or create your own."
        >
          <Button asChild>
            <Link to="/settings/providers">
              <Settings />
              Set Up AI Provider
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setShowDemos(true)}>
            Explore Demo Voices
          </Button>
        </EmptyState>
      </div>
    );
  }

  if (!hasClones) {
    return (
      <div className="space-y-8">
        <EmptyState
          icon={Mic}
          heading="Create Your First Clone"
          description="Upload writing samples to create a voice clone that captures your unique style."
        >
          <Button asChild>
            <Link to="/clones/new">
              <Plus />
              Create Clone
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
          <h1 className="text-4xl font-bold tracking-tight">Clones</h1>
          <p className="text-muted-foreground mt-2">
            {hasProvider
              ? 'Your voice clones and demos.'
              : 'Explore demo voices to see what Sona can do.'}
          </p>
        </div>
        {hasProvider && (
          <Button asChild>
            <Link to="/clones/new">
              <Plus />
              New Clone
            </Link>
          </Button>
        )}
      </div>

      {!hasProvider && (
        <div className="flex items-center gap-4">
          <Button asChild size="sm" variant="outline">
            <Link to="/settings/providers">
              <Settings />
              Set Up AI Provider
            </Link>
          </Button>
        </div>
      )}

      <CloneListFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        hideDemos={hideDemoClones}
        onHideDemosChange={setHideDemoClones}
      />

      {filteredClones.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClones.map((clone) => (
            <CloneCard key={clone.id} clone={clone} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          heading="No clones match your filters"
          description="Try adjusting your search or filter criteria."
        >
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </EmptyState>
      )}

      <DeletedClones />
    </div>
  );
}
