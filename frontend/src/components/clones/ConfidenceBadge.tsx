import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  score: number;
  className?: string;
}

function getTier(score: number) {
  if (score >= 80) return { label: 'Ready for use', color: 'bg-success text-success-foreground' };
  if (score >= 60)
    return { label: 'Needs improvement', color: 'bg-warning text-warning-foreground' };
  return { label: 'Needs samples', color: 'bg-destructive text-destructive-foreground' };
}

export function ConfidenceBadge({ score, className }: ConfidenceBadgeProps) {
  const { label, color } = getTier(score);

  return (
    <Badge className={cn(color, className)}>
      {score}% — {label}
    </Badge>
  );
}
