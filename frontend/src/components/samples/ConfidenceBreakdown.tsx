import { Lightbulb } from 'lucide-react';

import { ConfidenceBadge } from '@/components/clones/ConfidenceBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ConfidenceComponent {
  key: string;
  name: string;
  score: number;
  maxScore: number;
}

interface ConfidenceBreakdownProps {
  score: number;
  components: ConfidenceComponent[];
  className?: string;
}

const recommendations: Record<string, { threshold: number; message: string }> = {
  word_count: {
    threshold: 15,
    message: 'Add more writing samples to improve voice capture accuracy.',
  },
  sample_count: {
    threshold: 16,
    message: 'Add more samples. Variety helps capture your voice more accurately.',
  },
  type_variety: {
    threshold: 10,
    message: 'Try adding different content types for more complete voice capture.',
  },
  length_mix: {
    threshold: 8,
    message: 'Add content of varying lengths for better analysis.',
  },
  consistency: {
    threshold: 8,
    message: 'Your samples show inconsistent voice patterns. Run Voice DNA analysis.',
  },
};

function barColor(score: number, maxScore: number) {
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return 'bg-success';
  if (pct >= 60) return 'bg-warning';
  return 'bg-destructive';
}

export function ConfidenceBreakdown({ score, components, className }: ConfidenceBreakdownProps) {
  const tips =
    score < 80
      ? components
          .filter((c) => {
            const rec = recommendations[c.key];
            return rec && c.score < rec.threshold;
          })
          .map((c) => recommendations[c.key].message)
      : [];

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Confidence Score</CardTitle>
          <ConfidenceBadge score={score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {components.map((c) => (
          <div key={c.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{c.name}</span>
              <span className="text-muted-foreground">
                {c.score}/{c.maxScore}
              </span>
            </div>
            <div className="bg-muted h-2 rounded-full">
              <div
                className={cn('h-2 rounded-full', barColor(c.score, c.maxScore))}
                style={{ width: `${(c.score / c.maxScore) * 100}%` }}
              />
            </div>
          </div>
        ))}

        {tips.length > 0 && (
          <div className="border-border mt-2 space-y-2 border-t pt-4">
            {tips.map((tip) => (
              <div key={tip} className="text-muted-foreground flex items-start gap-2 text-sm">
                <Lightbulb className="text-warning mt-0.5 size-4 shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
