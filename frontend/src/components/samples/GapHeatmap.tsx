import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSamples } from '@/hooks/use-samples';
import { cn } from '@/lib/utils';

import { CONTENT_TYPE_LABELS, CONTENT_TYPES } from './constants';

const LENGTH_CATEGORIES = ['short', 'medium', 'long'] as const;

const LENGTH_LABELS: Record<string, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
};

function buildCounts(samples: { content_type: string; length_category: string | null }[]) {
  const counts = new Map<string, number>();
  for (const s of samples) {
    if (!s.length_category) continue;
    const key = `${s.content_type}:${s.length_category}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function cellClass(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count === 1) return 'bg-warning/20';
  return 'bg-success/20';
}

function getRecommendations(counts: Map<string, number>, limit = 3) {
  const gaps: string[] = [];
  for (const ct of CONTENT_TYPES) {
    for (const len of LENGTH_CATEGORIES) {
      if (gaps.length >= limit) return gaps;
      const key = `${ct.value}:${len}`;
      if (!counts.has(key) || counts.get(key) === 0) {
        gaps.push(`Add a ${LENGTH_LABELS[len].toLowerCase()} ${ct.label} sample`);
      }
    }
  }
  return gaps;
}

interface GapHeatmapProps {
  cloneId: string;
}

export function GapHeatmap({ cloneId }: GapHeatmapProps) {
  const { data } = useSamples(cloneId);
  const samples = data?.items ?? [];
  const counts = buildCounts(samples);
  const recommendations = getRecommendations(counts);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-muted-foreground p-2 text-left font-medium" />
                {LENGTH_CATEGORIES.map((len) => (
                  <th key={len} className="text-muted-foreground p-2 text-center font-medium">
                    {LENGTH_LABELS[len]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONTENT_TYPES.map((ct) => (
                <tr key={ct.value}>
                  <td className="text-muted-foreground p-2 font-medium">
                    {CONTENT_TYPE_LABELS[ct.value]}
                  </td>
                  {LENGTH_CATEGORIES.map((len) => {
                    const key = `${ct.value}:${len}`;
                    const count = counts.get(key) ?? 0;
                    return (
                      <td
                        key={len}
                        data-testid={`cell-${ct.value}-${len}`}
                        className={cn('rounded-md p-2 text-center', cellClass(count))}
                      >
                        {count > 0 ? count : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-sm font-medium">Recommendations</p>
            {recommendations.map((rec) => (
              <p key={rec} data-testid="recommendation" className="text-muted-foreground text-sm">
                {rec}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
