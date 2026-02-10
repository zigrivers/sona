import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { MethodologyVersionResponse } from '@/types/api';

interface VersionHistoryProps {
  versions: MethodologyVersionResponse[];
  onRevert: (version: number) => void;
  isLoading: boolean;
}

export function VersionHistory({ versions, onRevert, isLoading }: VersionHistoryProps) {
  const [revertVersion, setRevertVersion] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (versions.length === 0) {
    return <p className="text-muted-foreground text-sm">No version history.</p>;
  }

  return (
    <>
      <ul className="space-y-2">
        {versions.map((v) => (
          <li key={v.id} className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Version {v.version_number}</span>
              <Badge variant="secondary">{v.trigger}</Badge>
              <span className="text-muted-foreground text-xs">
                {new Date(v.created_at).toLocaleString()}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRevertVersion(v.version_number)}>
              Revert
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={revertVersion !== null} onOpenChange={() => setRevertVersion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will revert the methodology to version {revertVersion}. A new version will be
              created with the reverted content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevertVersion(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (revertVersion !== null) {
                  onRevert(revertVersion);
                  setRevertVersion(null);
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
