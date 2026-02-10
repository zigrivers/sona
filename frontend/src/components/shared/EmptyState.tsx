import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  heading: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  heading,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {Icon && <Icon className="text-muted-foreground mb-4 size-12" />}
      <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
      {description && <p className="text-muted-foreground mt-2 max-w-md">{description}</p>}
      {children && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>
      )}
    </div>
  );
}
