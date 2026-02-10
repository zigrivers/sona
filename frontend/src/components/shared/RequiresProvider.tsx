import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import { useHasProvider } from '@/hooks/use-providers';

interface RequiresProviderProps {
  children: ReactNode;
}

export function RequiresProvider({ children }: RequiresProviderProps) {
  const { hasProvider, isLoading } = useHasProvider();

  if (isLoading) {
    return <Skeleton data-testid="requires-provider-skeleton" className="h-9 w-32 rounded-md" />;
  }

  if (!hasProvider) {
    return (
      <p className="text-muted-foreground text-sm">
        No AI provider configured.{' '}
        <Link to="/settings/providers" className="text-primary underline underline-offset-4">
          Configure
        </Link>
      </p>
    );
  }

  return <>{children}</>;
}
