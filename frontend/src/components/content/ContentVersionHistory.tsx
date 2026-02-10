import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useContentVersions, useRestoreContentVersion } from '@/hooks/use-content';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { ContentVersionResponse } from '@/types/api';

const TRIGGER_LABELS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  generation: { label: 'Generated', variant: 'default' },
  inline_edit: { label: 'Edited', variant: 'secondary' },
  regeneration: { label: 'Regenerated', variant: 'secondary' },
  feedback_driven: { label: 'Feedback', variant: 'outline' },
  restore: { label: 'Restored', variant: 'outline' },
};

function getTriggerBadge(trigger: string) {
  const config = TRIGGER_LABELS[trigger] ?? { label: trigger, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getWordCountDelta(versions: ContentVersionResponse[], index: number): string | null {
  // Last version (oldest) is baseline — no delta
  if (index === versions.length - 1) return null;
  const delta = versions[index].word_count - versions[index + 1].word_count;
  if (delta === 0) return null;
  return delta > 0 ? `+${delta} words` : `${delta} words`;
}

interface ContentVersionHistoryProps {
  contentId: string;
}

export function ContentVersionHistory({ contentId }: ContentVersionHistoryProps) {
  const { data, isLoading, isError } = useContentVersions(contentId);
  const restore = useRestoreContentVersion(contentId);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersionResponse | null>(null);

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
    return <p className="text-muted-foreground text-sm">No versions yet.</p>;
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-64">
        <div className="space-y-1">
          {versions.map((version, index) => {
            const isSelected = selectedVersion?.id === version.id;
            const delta = getWordCountDelta(versions, index);

            return (
              <button
                key={version.id}
                type="button"
                onClick={() => setSelectedVersion(version)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                  isSelected ? 'border-primary bg-accent' : 'hover:bg-accent/50 border-transparent'
                )}
              >
                <span className="font-medium">v{version.version_number}</span>
                {getTriggerBadge(version.trigger)}
                {delta && <span className="text-muted-foreground">{delta}</span>}
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
            <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap">
              {selectedVersion.content_text}
            </div>
            <Button
              onClick={() => restore.mutate(selectedVersion.version_number)}
              disabled={restore.isPending}
            >
              {restore.isPending ? 'Restoring…' : 'Restore this version'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
