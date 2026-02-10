import { Mic, Plus, Settings } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useClones } from '@/hooks/use-clones';
import { useHasProvider } from '@/hooks/use-providers';

export function ClonesPage() {
  const { hasProvider, isLoading: providersLoading } = useHasProvider();
  const { data: cloneData, isLoading: clonesLoading } = useClones();
  const [showDemos, setShowDemos] = useState(false);

  const isLoading = providersLoading || clonesLoading;

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

  const demoClones = cloneData?.items.filter((c) => c.is_demo) ?? [];

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
              Create Your First Clone
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

      {demoClones.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {demoClones.map((clone) => (
            <Card key={clone.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {clone.name}
                  <Badge variant="secondary">Demo</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {clone.description ?? `${clone.sample_count} samples`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
