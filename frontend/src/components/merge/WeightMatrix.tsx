import { useMemo } from 'react';

import { DNA_CATEGORIES } from '@/components/clones/dna-categories';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { DNACategory } from '@/types/dna';

interface WeightMatrixProps {
  cloneNames: Record<string, string>;
  weights: Record<string, Record<DNACategory, number>>;
  onChange: (cloneId: string, category: DNACategory, value: number) => void;
}

export function WeightMatrix({ cloneNames, weights, onChange }: WeightMatrixProps) {
  const cloneIds = useMemo(() => Object.keys(weights), [weights]);

  if (cloneIds.length === 0) return null;

  return (
    <div className="space-y-6">
      <Label className="text-base font-semibold">Weight Distribution</Label>
      <div className="space-y-4">
        {DNA_CATEGORIES.map((category) => (
          <WeightRow
            key={category.key}
            category={category}
            cloneIds={cloneIds}
            cloneNames={cloneNames}
            weights={weights}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

interface WeightRowProps {
  category: (typeof DNA_CATEGORIES)[number];
  cloneIds: string[];
  cloneNames: Record<string, string>;
  weights: Record<string, Record<DNACategory, number>>;
  onChange: (cloneId: string, category: DNACategory, value: number) => void;
}

function WeightRow({ category, cloneIds, cloneNames, weights, onChange }: WeightRowProps) {
  const categoryKey = category.key as DNACategory;

  const rowTotal = cloneIds.reduce((sum, id) => sum + (weights[id]?.[categoryKey] ?? 0), 0);

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium">{category.label}</p>
      <div className="mt-3 space-y-3">
        {cloneIds.map((id) => {
          const value = weights[id]?.[categoryKey] ?? 50;
          const pct =
            rowTotal > 0 ? Math.round((value / rowTotal) * 100) : Math.round(100 / cloneIds.length);

          return (
            <div key={id} className="flex items-center gap-4">
              <span className="text-muted-foreground w-28 truncate text-sm">
                {cloneNames[id] ?? id}
              </span>
              <Slider
                min={0}
                max={100}
                value={[value]}
                onValueChange={([v]) => onChange(id, categoryKey, v)}
                className="flex-1"
                aria-label={`${cloneNames[id] ?? id} ${category.label} weight`}
              />
              <span className="text-muted-foreground w-12 text-right text-sm">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
