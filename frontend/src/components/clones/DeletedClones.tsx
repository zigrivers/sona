import { RotateCcw, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDeletedClones, useRestoreClone } from '@/hooks/use-clones';

function daysRemaining(deletedAt: string): number {
  const deletedDate = new Date(deletedAt);
  const expiresDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(0, Math.ceil((expiresDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}

export function DeletedClones() {
  const { data } = useDeletedClones();
  const restoreMutation = useRestoreClone();

  const deletedClones = data?.items ?? [];

  if (deletedClones.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
        <Trash2 className="size-4" />
        No deleted clones
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trash2 className="text-muted-foreground size-4" />
        <span className="text-sm font-medium">Deleted Clones</span>
        <Badge variant="secondary">{deletedClones.length}</Badge>
      </div>

      <div className="divide-border divide-y rounded-lg border">
        {deletedClones.map((clone) => (
          <div key={clone.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="text-sm font-medium">{clone.name}</span>
              <span className="text-muted-foreground ml-2 text-xs">
                {clone.deleted_at && `${daysRemaining(clone.deleted_at)} days remaining`}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => restoreMutation.mutate(clone.id)}
              disabled={restoreMutation.isPending}
            >
              <RotateCcw className="mr-1 size-3" />
              Restore
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
