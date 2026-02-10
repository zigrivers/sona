import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useDnaVersions, useRevertDna } from '@/hooks/use-dna';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { DNAResponse } from '@/types/api';

import { DNA_CATEGORIES } from './dna-categories';

const TRIGGER_LABELS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  initial_analysis: { label: 'Analyzed', variant: 'default' },
  regeneration: { label: 'Regenerated', variant: 'secondary' },
  manual_edit: { label: 'Edited', variant: 'secondary' },
  revert: { label: 'Reverted', variant: 'outline' },
};

function getTriggerBadge(trigger: string) {
  const config = TRIGGER_LABELS[trigger] ?? { label: trigger, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function DnaPreview({ dna }: { dna: DNAResponse }) {
  const dnaData = dna.data as Record<string, unknown>;

  return (
    <div className="space-y-3">
      {DNA_CATEGORIES.map((category) => {
        const categoryData = (dnaData[category.key] as Record<string, unknown>) ?? {};
        const entries = category.fields
          .map((field) => {
            const value = categoryData[field.key];
            if (value == null) return null;
            const display = Array.isArray(value) ? value.join(', ') : String(value);
            return `${field.label}: ${display}`;
          })
          .filter(Boolean);

        if (entries.length === 0) return null;

        return (
          <div key={category.key}>
            <p className="text-sm font-medium">{category.label}</p>
            <p className="text-muted-foreground text-sm">{entries.join(' · ')}</p>
          </div>
        );
      })}
    </div>
  );
}

interface DnaVersionHistoryProps {
  cloneId: string;
}

export function DnaVersionHistory({ cloneId }: DnaVersionHistoryProps) {
  const { data, isLoading, isError } = useDnaVersions(cloneId);
  const revert = useRevertDna(cloneId);
  const [selectedVersion, setSelectedVersion] = useState<DNAResponse | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} data-testid="version-skeleton" className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-muted-foreground text-sm">Failed to load version history.</p>;
  }

  const versions = data?.items ?? [];

  if (versions.length === 0) {
    return <p className="text-muted-foreground text-sm">No version history.</p>;
  }

  const currentVersionNumber = versions[0]?.version_number;

  return (
    <div className="space-y-4">
      <ScrollArea className="h-64">
        <div className="space-y-1">
          {versions.map((version) => {
            const isSelected = selectedVersion?.id === version.id;
            const isCurrent = version.version_number === currentVersionNumber;

            return (
              <button
                key={version.id}
                type="button"
                onClick={() => setSelectedVersion(version)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                  isSelected
                    ? 'border-primary bg-accent'
                    : isCurrent
                      ? 'border-primary/50 bg-accent/30'
                      : 'hover:bg-accent/50 border-transparent'
                )}
              >
                <span className="font-medium">v{version.version_number}</span>
                {getTriggerBadge(version.trigger)}
                {isCurrent && <span className="text-muted-foreground text-xs">(current)</span>}
                <span className="text-muted-foreground ml-auto">
                  {formatRelativeTime(version.created_at)}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {selectedVersion && (
        <Card>
          <CardHeader>
            <CardTitle>Version {selectedVersion.version_number} Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DnaPreview dna={selectedVersion} />
            {selectedVersion.version_number !== currentVersionNumber && (
              <Button
                onClick={() => revert.mutate(selectedVersion.version_number)}
                disabled={revert.isPending}
              >
                {revert.isPending ? 'Reverting…' : 'Revert to this version'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
