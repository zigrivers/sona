import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function scoreStyle(score: number): string {
  if (score >= 80) return 'bg-success text-success-foreground';
  if (score >= 60) return 'bg-info text-info-foreground';
  if (score >= 40) return 'bg-warning text-warning-foreground';
  return 'bg-destructive text-white';
}

export function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) {
    return <span className="text-muted-foreground">--</span>;
  }
  return (
    <Badge variant="outline" className={cn('border-transparent', scoreStyle(score))}>
      {score}
    </Badge>
  );
}
