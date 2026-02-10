import { ArrowDown, ArrowUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { DNAResponse } from '@/types/api';
import { DNA_CATEGORIES } from '@/types/dna';

import { DNA_CATEGORIES as CATEGORY_CONFIGS } from './dna-categories';

const TRIGGER_LABELS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  initial_analysis: { label: 'Analyzed', variant: 'default' },
  regeneration: { label: 'Regenerated', variant: 'secondary' },
  manual_edit: { label: 'Edited', variant: 'secondary' },
  revert: { label: 'Reverted', variant: 'outline' },
};

interface Delta {
  label: string;
  delta: number;
}

function computeDeltas(current: DNAResponse, previous: DNAResponse): Delta[] {
  const currScores = current.prominence_scores as Record<string, unknown> | null;
  const prevScores = previous.prominence_scores as Record<string, unknown> | null;

  if (!currScores || !prevScores) return [];

  const deltas: Delta[] = [];

  for (const key of DNA_CATEGORIES) {
    const curr = currScores[key];
    const prev = prevScores[key];

    if (typeof curr !== 'number' || typeof prev !== 'number') continue;

    const diff = curr - prev;
    if (Math.abs(diff) <= 0.05) continue;

    const config = CATEGORY_CONFIGS.find((c) => c.key === key);
    deltas.push({
      label: config?.label ?? key,
      delta: diff,
    });
  }

  return deltas;
}

interface DnaTimelineProps {
  versions: DNAResponse[];
}

export function DnaTimeline({ versions }: DnaTimelineProps) {
  if (versions.length <= 1) return null;

  // API returns newest-first; reverse to oldest-first for chronological display
  const chronological = [...versions].reverse();

  return (
    <div className="space-y-0">
      {chronological.map((version, index) => {
        const previous = index > 0 ? chronological[index - 1] : null;
        const deltas = previous ? computeDeltas(version, previous) : [];
        const triggerConfig = TRIGGER_LABELS[version.trigger] ?? {
          label: version.trigger,
          variant: 'outline' as const,
        };

        return (
          <div key={version.id} data-testid="timeline-entry" className="relative flex gap-3 pb-6">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="bg-primary size-2 rounded-full" />
              {index < chronological.length - 1 && <div className="bg-border w-px flex-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 -mt-1 space-y-1">
              <div className="flex items-center gap-2">
                <span data-testid="timeline-version" className="text-sm font-medium">
                  v{version.version_number}
                </span>
                <Badge variant={triggerConfig.variant}>{triggerConfig.label}</Badge>
                <span className="text-muted-foreground text-xs">
                  {formatRelativeTime(version.created_at)}
                </span>
              </div>

              {deltas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {deltas.map((d) => {
                    const points = Math.round(d.delta * 100);
                    const isPositive = points > 0;

                    return (
                      <span
                        key={d.label}
                        data-testid="delta-chip"
                        className={cn(
                          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                          isPositive
                            ? 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                        )}
                      >
                        {isPositive ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )}
                        {d.label} {isPositive ? `+${points}` : points}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
