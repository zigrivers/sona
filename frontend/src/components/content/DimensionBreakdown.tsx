import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { DimensionScore } from '@/types/api';

interface DimensionBreakdownProps {
  dimensions: DimensionScore[];
}

function getScoreColor(score: number) {
  if (score >= 75) return 'text-green-700';
  if (score >= 50) return 'text-yellow-700';
  return 'text-red-700';
}

export function DimensionBreakdown({ dimensions }: DimensionBreakdownProps) {
  // Dimensions below 70 start expanded
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const d of dimensions) {
      if (d.score < 70) initial.add(d.name);
    }
    return initial;
  });

  if (dimensions.length === 0) return null;

  const sorted = [...dimensions].sort((a, b) => a.score - b.score);

  function toggleDimension(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="space-y-1">
      {sorted.map((dim) => {
        const isExpanded = expanded.has(dim.name);
        return (
          <div key={dim.name}>
            <button
              type="button"
              className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm"
              onClick={() => toggleDimension(dim.name)}
            >
              {isExpanded ? (
                <ChevronDown className="size-3.5 shrink-0" />
              ) : (
                <ChevronRight className="size-3.5 shrink-0" />
              )}
              <span data-testid="dimension-name" className="flex-1">
                {dim.name}
              </span>
              <span className={cn('font-mono font-semibold', getScoreColor(dim.score))}>
                {dim.score}
              </span>
            </button>
            {isExpanded && (
              <p className="text-muted-foreground ml-8 pb-1 text-xs">{dim.feedback}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
