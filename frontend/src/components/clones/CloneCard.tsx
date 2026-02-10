import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatRelativeTime, formatSampleCount, getInitials } from '@/lib/utils';
import type { CloneResponse } from '@/types/api';

import { ConfidenceBadge } from './ConfidenceBadge';

const AVATAR_COLORS = [
  'bg-primary text-primary-foreground',
  'bg-info text-info-foreground',
  'bg-success text-success-foreground',
  'bg-warning text-warning-foreground',
  'bg-destructive text-destructive-foreground',
] as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'merged':
      return <Badge className="bg-info text-info-foreground">Merged</Badge>;
    case 'demo':
      return <Badge variant="secondary">Demo</Badge>;
    default:
      return <Badge variant="default">Original</Badge>;
  }
}

interface CloneCardProps {
  clone: CloneResponse;
}

export function CloneCard({ clone }: CloneCardProps) {
  const colorClass = AVATAR_COLORS[hashName(clone.name) % AVATAR_COLORS.length];

  return (
    <Link to={`/clones/${clone.id}`} className="block focus-visible:outline-none">
      <Card className="cursor-pointer transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
        <CardHeader className="flex-row items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback className={cn(colorClass)}>{getInitials(clone.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <CardTitle className="truncate">{clone.name}</CardTitle>
            {getTypeBadge(clone.type)}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <ConfidenceBadge score={clone.confidence_score} />
          <span>{formatSampleCount(clone.sample_count)}</span>
          <span>Updated {formatRelativeTime(clone.updated_at)}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
