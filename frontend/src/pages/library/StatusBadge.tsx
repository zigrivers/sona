import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-warning text-warning-foreground',
  approved: 'bg-info text-info-foreground',
  published: 'bg-success text-success-foreground',
  archived: 'bg-muted/50 text-muted-foreground',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <Badge variant="outline" className={cn('border-transparent', style)}>
      {status}
    </Badge>
  );
}
